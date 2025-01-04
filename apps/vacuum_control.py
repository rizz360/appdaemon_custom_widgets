import hassapi as hass
import json
from typing import Dict, List, Optional, Tuple, Union, Any, Tuple

class VacuumControl(hass.Hass):
    """AppDaemon app for controlling multiple Dreame vacuum robots."""
    
    def initialize(self) -> None:
        """Initialize the vacuum control app."""
        try:
            self.log("Initializing Vacuum Control")
            
            # Register API endpoints
            self.register_endpoint(self.get_vacuums_callback, "vacuum_info")
            self.register_endpoint(self.get_rooms_callback, "vacuum_rooms")
            self.register_endpoint(self.start_cleaning_callback, "vacuum_start")
            self.register_endpoint(self.get_status_callback, "vacuum_status")
            
            self.log("Registered endpoints:")
            self.log("- /api/appdaemon/vacuum_info")
            self.log("- /api/appdaemon/vacuum_rooms")
            self.log("- /api/appdaemon/vacuum_start")
            self.log("- /api/appdaemon/vacuum_status")
            
            self.log("Vacuum Control initialized successfully")
        except Exception as e:
            self.error(f"Failed to initialize Vacuum Control: {str(e)}")
            raise

    def validate_vacuum_id(self, vacuum_id: str) -> Optional[str]:
        """Validate vacuum ID and return full entity ID if valid."""
        if not vacuum_id:
            return None
            
        entity_id = f"vacuum.{vacuum_id}"
        if not self.entity_exists(entity_id):
            return None
            
        return entity_id

    def get_vacuums_callback(self, args: Dict, request: Dict) -> Tuple[Dict, int]:
        """Get information about available vacuums."""
        self.log(f"Received vacuum info request")
        try:
            vacuums = []
            vacuum_states = self.get_state("vacuum")
            
            for entity_id, state in vacuum_states.items():
                if not state:
                    continue
                    
                attrs = state.get("attributes", {})
                vacuums.append({
                    "id": entity_id.split(".")[1],
                    "entity_id": entity_id,
                    "name": attrs.get("friendly_name", entity_id),
                    "state": state.get("state", "unknown"),
                    "battery_level": attrs.get("battery_level", 0),
                    "cleaning_count": attrs.get("cleaning_count", 0)
                })
            
            self.log(f"Retrieved {len(vacuums)} vacuums: {vacuums}")
            self.log(f"Available vacuums: {[v['id'] for v in vacuums]}")  # Log the IDs of available vacuums
            return {"success": True, "vacuums": vacuums}, 200
            
        except Exception as e:
            self.error(f"Error in get_vacuums: {str(e)}")
            return {"success": False, "error": str(e)}, 500

    def get_rooms_callback(self, args: Dict, request: Dict) -> Tuple[Dict, int]:
        """Get rooms for a specific vacuum."""
        self.log(f"Received rooms request: {request}, args: {args}")
        try:
            # Get vacuum_id from query parameters
            vacuum_id = args.get('vacuum_id')
            if not vacuum_id:
                return {
                    "success": False,
                    "error": "No vacuum_id specified"
                }, 400
                    
            entity_id = self.validate_vacuum_id(vacuum_id)
            if not entity_id:
                return {
                    "success": False,
                    "error": f"Invalid vacuum_id: {vacuum_id}"
                }, 400

            # Get vacuum state
            state = self.get_state(entity_id, attribute="all")
            if not state:
                return {
                    "success": False,
                    "error": f"Vacuum {entity_id} not found"
                }, 404

            # Access the rooms attribute in the vacuum state
            rooms_map = state.get("attributes", {}).get("rooms", {})
            
            if not rooms_map:
                return {
                    "success": False,
                    "error": "No rooms found for the vacuum."
                }, 404
            
            # Select the first or last available map (in this case, we'll choose the last one)
            room_data = list(rooms_map.values())[-1]  # Get the last map, you can adjust this if you want another strategy

            # Prepare rooms data
            rooms = []
            for room in room_data:
                try:
                    rooms.append({
                        "id": room.get("id"),
                        "name": room.get("name"),
                        "icon": room.get("icon")  # Adding the icon, if available
                    })
                except Exception as e:
                    self.log(f"Error processing room data: {room}, Error: {str(e)}", level="WARNING")

            rooms.sort(key=lambda x: x["name"])  # Sort rooms by name
            self.log(f"Returning {len(rooms)} rooms for {entity_id}")
            return {"success": True, "rooms": rooms}, 200
                
        except Exception as e:
            self.error(f"Error in get_rooms: {str(e)}")
            return {"success": False, "error": str(e)}, 500


    def get_status_callback(self, args: Dict, request: Dict) -> Tuple[Dict, int]:
        """Get detailed status for a specific vacuum."""
        self.log(f"Received status request: {request}, args: {args}")
        try:
            vacuum_id = args.get('vacuum_id')
            if not vacuum_id:
                return {
                    "success": False,
                    "error": "No vacuum_id specified"
                }, 400
                
            entity_id = self.validate_vacuum_id(vacuum_id)
            if not entity_id:
                return {
                    "success": False,
                    "error": f"Invalid vacuum_id: {vacuum_id}"
                }, 400

            state = self.get_state(entity_id, attribute="all")
            if not state:
                return {
                    "success": False,
                    "error": f"Vacuum {entity_id} not found"
                }, 404

            attrs = state.get("attributes", {})
            return {
                "success": True,
                "status": {
                    "state": state.get("state", "unknown"),
                    "battery_level": attrs.get("battery_level", 0),
                    "cleaning_count": attrs.get("cleaning_count", 0),
                    "cleaning_time": attrs.get("cleaning_time", 0),
                    "current_segment": attrs.get("current_segment"),
                    "error_code": attrs.get("error_code"),
                    "last_clean_end": attrs.get("last_clean_end"),
                    "last_clean_start": attrs.get("last_clean_start")
                }
            }, 200
            
        except Exception as e:
            self.error(f"Error in get_status: {str(e)}")
            return {"success": False, "error": str(e)}, 500

    def start_cleaning_callback(self, args: dict, request) -> tuple:
        """Start cleaning selected rooms."""
        self.log(f"Received start cleaning request with args: {args}")
        
        try:
            # In AppDaemon, the request data comes through the args parameter
            # The actual request object doesn't contain the body directly
            if not args:
                self.error("No request data received!")
                return {"success": False, "error": "No request data received!"}, 400

            # Extract relevant fields from args
            vacuum_id = args.get('vacuum_id')
            segments = args.get('segments')
            repeats = args.get('repeats', 1)

            if not vacuum_id:
                self.error("No vacuum_id specified!")
                return {"success": False, "error": "No vacuum_id specified!"}, 400

            if not segments or not isinstance(segments, list):
                self.error("Invalid segments: must be a non-empty list!")
                return {"success": False, "error": "Invalid segments: must be a non-empty list!"}, 400

            entity_id = self.validate_vacuum_id(vacuum_id)
            if not entity_id:
                self.error(f"Invalid vacuum_id: {vacuum_id}")
                return {"success": False, "error": f"Invalid vacuum_id: {vacuum_id}"}, 400

            # Start cleaning
            self.log(f"Starting cleaning for {entity_id}, segments: {segments}, repeats: {repeats}")
            self.call_service(
                "dreame_vacuum/vacuum_clean_segment",
                entity_id=entity_id,
                segments=segments,
                repeats=repeats
            )

            return {"success": True}, 200

        except Exception as e:
            self.error(f"Error in start_cleaning: {str(e)}")
            return {"success": False, "error": str(e)}, 500