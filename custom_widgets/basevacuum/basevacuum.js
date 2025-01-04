function basevacuum(widget_id, url, skin, parameters) {
    console.log("Initializing vacuum widget with params:", parameters)

    // Will be using "self" throughout for consistency
    self = this

    // Initialization
    self.widget_id = widget_id
    self.parameters = parameters

    // Define callbacks first
    function onRoomClick(self, roomElement) {
        console.log("Room clicked:", roomElement)
        const roomId = parseInt(roomElement.getAttribute('data-room-id'))
        if (!roomId) {
            console.log("No valid room ID found")
            return
        }

        // Add tap feedback
        roomElement.classList.add('tapped')
        setTimeout(() => {
            roomElement.classList.remove('tapped')
        }, 200)

        const room = self.rooms.find(r => r.id === roomId)
        const isSelected = self.selectedRooms.includes(roomId)

        if (isSelected) {
            console.log(`Unselecting room: ${room.name} (ID: ${roomId})`)
            self.selectedRooms = self.selectedRooms.filter(id => id !== roomId)
        } else {
            console.log(`Selecting room: ${room.name} (ID: ${roomId})`)
            self.selectedRooms.push(roomId)
        }

        console.log("Currently selected rooms:",
            self.selectedRooms.map(id => self.rooms.find(r => r.id === id).name))
        updateRoomView(self)
    }
    function onStartClick(self) {
        console.log("Start cleaning clicked")
        if (self.selectedRooms.length === 0) {
            console.log("No rooms selected - cannot start cleaning")
            return
        }

        // Extract vacuum ID from parameters
        const vacuum_id = (self.parameters.entity || "").split(".")[1]
        if (!vacuum_id) {
            console.log("No valid vacuum_id found")
            return
        }

        // Prepare the request payload
        const requestData = {
            vacuum_id: vacuum_id, // Include the vacuum_id
            segments: self.selectedRooms, // List of selected room IDs
            repeats: 1 // Default repeat count, make dynamic if needed
        }

        console.log(`Starting cleaning with request data:`, requestData)

        // Call the API to start cleaning
        $.ajax({
            url: `${url}/api/appdaemon/vacuum_start`,
            method: 'POST',
            data: JSON.stringify(requestData),
            contentType: 'application/json',
            success: function (response) {
                console.log("Cleaning started successfully:", response)
                if (response.success) {
                    self.selectedRooms = [] // Clear selected rooms
                    updateRoomView(self) // Update the UI
                    const startCleanButton = document.querySelector('.start-clean')
                    if (startCleanButton) {
                        startCleanButton.textContent = `${vacuum_id} now cleaning`
                    }
                }
            },
            error: function (err) {
                console.error("Error starting cleaning:", err)
            }
        })
    }


    // Setup callbacks for events - AFTER defining the functions
    var callbacks = [
        { "selector": '#' + widget_id + ' .room-select', "action": "click", "callback": onRoomClick }
    ]
    // Monitor vacuum entity - This is not used anymore, so we can skip it
    var monitored_entities = [

    ]
    // Call the parent constructor to get things moving
    WidgetBase.call(self, widget_id, url, skin, parameters, monitored_entities, callbacks)

    // Set initial values
    self.state = {}
    self.state.room_list = ""
    self.rooms = []
    self.selectedRooms = []

    // Fetch the rooms data after initialization
    fetchRooms(self)

    // Fetch the rooms
    function fetchRooms(self) {
        const vacuum_id = (self.parameters.entity || "").split(".")[1]

        if (!vacuum_id) {
            console.log("No valid vacuum_id found")
            return
        }

        $.ajax({
            url: `${url}/api/appdaemon/vacuum_rooms?vacuum_id=${vacuum_id}`,
            method: "GET",
            success: function (response) {
                if (response.success) {
                    self.rooms = response.rooms
                    console.log("Rooms loaded:", self.rooms)
                    updateRoomView(self)
                } else {
                    console.error("Error fetching rooms:", response.error)
                }
            },
            error: function (err) {
                console.error("Error fetching rooms:", err)
            },
        })
    }


    // Update the room display
    function updateRoomView(self) {
        console.log("Updating room view with rooms:", self.rooms)
        var roomHtml = ""
        self.rooms.forEach(function (room) {
            var selected = self.selectedRooms.includes(room.id) ? " selected" : ""
            var icon = room.icon // Get the icon from the room data
            roomHtml += `<div class="room-select${selected}" data-room-id="${room.id}" data-icon="${icon}">${room.name}</div>`
        })

        const vacuum_id = (self.parameters.entity || "").split(".")[1]
        roomHtml += `<div class="start-clean">Start ${vacuum_id}</div>`

        // Update state and UI
        self.state.room_list = roomHtml
        const roomListContainer = document.getElementById("room_list")
        roomListContainer.innerHTML = roomHtml

        // Rebind click events for dynamically generated elements
        const roomElements = roomListContainer.getElementsByClassName("room-select")
        Array.from(roomElements).forEach((roomElement) => {
            const icon = roomElement.getAttribute("data-icon")
            roomElement.addEventListener("click", () => onRoomClick(self, roomElement))
        })
        // Attach onStartClick to the .start-clean button
        const startCleanButton = roomListContainer.getElementsByClassName("start-clean")[0]
        if (startCleanButton) {
            startCleanButton.addEventListener("click", () => onStartClick(self))
        }
    }
}

// Add this at the end to ensure we know if the file is loaded
console.log("Vacuum widget script loaded")