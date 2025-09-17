function basevacuum(widget_id, url, skin, parameters) {
  console.log("Initializing vacuum widget with params:", parameters);

  // Will be using "self" throughout for consistency
  let self = this; // Use let instead of var

  // Initialization
  self.widget_id = widget_id;
  self.parameters = parameters;

  // Define callbacks first
  function onRoomClick(event) {
    // Add event to the click callback function

    const roomElement = event.target; // get the room element from the click event

    if (!roomElement.classList.contains("room-select")) {
      return; // if it's not a room, don't do anything
    }

    const roomId = parseInt(roomElement.getAttribute("data-room-id"));
    if (!roomId) {
      console.log("No valid room ID found");
      return;
    }

    // Add tap feedback
    roomElement.classList.add("tapped");
    setTimeout(() => {
      roomElement.classList.remove("tapped");
    }, 200);

    const room = self.rooms.find((r) => r.id === roomId);
    const isSelected = self.selectedRooms.includes(roomId);

    if (isSelected) {
      console.log(`Unselecting room: ${room.name} (ID: ${roomId})`);
      self.selectedRooms = self.selectedRooms.filter((id) => id !== roomId);
    } else {
      console.log(`Selecting room: ${room.name} (ID: ${roomId})`);
      self.selectedRooms.push(roomId);
    }

    console.log(
      "Currently selected rooms:",
      self.selectedRooms.map((id) => self.rooms.find((r) => r.id === id).name)
    );
    updateRoomView(self);
  }
  function onStartClick() {
    console.log("Start cleaning clicked");
    if (self.selectedRooms.length === 0) {
      console.log("No rooms selected - cannot start cleaning");
      return;
    }

    // Extract vacuum ID from parameters
    const vacuum_id = (self.parameters.entity || "").split(".")[1];
    if (!vacuum_id) {
      console.log("No valid vacuum_id found");
      return;
    }

    // Prepare the request payload
    const requestData = {
      vacuum_id: vacuum_id, // Include the vacuum_id
      segments: self.selectedRooms, // List of selected room IDs
      repeats: 1, // Default repeat count, make dynamic if needed
    };

    console.log(`Starting cleaning with request data:`, requestData);

    // Call the API to start cleaning
    $.ajax({
      url: `${url}/api/appdaemon/vacuum_start`,
      method: "POST",
      data: JSON.stringify(requestData),
      contentType: "application/json",
      success: function (response) {
        console.log("Cleaning started successfully:", response);
        if (response.success) {
          self.selectedRooms = []; // Clear selected rooms
          updateRoomView(self); // Update the UI
          const startCleanButton = document.querySelector(
            "#" + widget_id + " .start-clean"
          );
          if (startCleanButton) {
            startCleanButton.textContent = `${vacuum_id} now cleaning`;
          }
        }
      },
      error: function (err) {
        console.error("Error starting cleaning:", err);
      },
    });
  }

  // Setup callbacks for events - AFTER defining the functions
  let callbacks = [
    {
      selector: "#" + widget_id + " .room-select",
      action: "click",
      callback: onRoomClick,
    },
  ];

  // Call the parent constructor to get things moving
  WidgetBase.call(self, widget_id, url, skin, parameters, [], callbacks);

  // Set initial values
  self.state = {};
  self.state.room_list = "";
  self.rooms = [];
  self.selectedRooms = [];

  // Fetch the rooms data after initialization
  fetchRooms(self);

  // Fetch the rooms
  function fetchRooms(self) {
    const vacuum_id = (self.parameters.entity || "").split(".")[1];

    if (!vacuum_id) {
      console.log("No valid vacuum_id found");
      return;
    }

    $.ajax({
      url: `${url}/api/appdaemon/vacuum_rooms?vacuum_id=${vacuum_id}`,
      method: "GET",
      success: function (response) {
        if (response.success) {
          self.rooms = response.rooms;
          console.log("Rooms loaded:", self.rooms);
          updateRoomView(self);
        } else {
          console.error("Error fetching rooms:", response.error);
        }
      },
      error: function (err) {
        console.error("Error fetching rooms:", err);
      },
    });
  }

  // Update the room display
  function updateRoomView(self) {
    console.log("Updating room view with rooms:", self.rooms);
    let roomHtml = "";
    self.rooms.forEach(function (room) {
      let selected = self.selectedRooms.includes(room.id) ? " selected" : "";
      let icon = room.icon; // Get the icon from the room data
      const iconClass = icon.replace(":", "-"); // Replace the semicolon for dash to use as a css class
      roomHtml += `<div class="room-select${selected} ${iconClass}" data-room-id="${room.id}">${room.name}</div>`;
    });

    const vacuum_id = (self.parameters.entity || "").split(".")[1];
    roomHtml += `<div class="start-clean">Start ${vacuum_id}</div>`;

    // Update state and UI
    self.state.room_list = roomHtml;
    const roomListContainer = document
      .getElementById(widget_id)
      .querySelector("#room_list");
    roomListContainer.innerHTML = roomHtml;

    // Rebind click events for dynamically generated elements
    const roomElements =
      roomListContainer.getElementsByClassName("room-select");
    Array.from(roomElements).forEach((roomElement) => {
      roomElement.addEventListener("click", onRoomClick);
    });
    // Attach onStartClick to the .start-clean button
    const startCleanButton =
      roomListContainer.getElementsByClassName("start-clean")[0];
    if (startCleanButton) {
      startCleanButton.addEventListener("click", onStartClick);
    }
  }
}

// Add this at the end to ensure we know if the file is loaded
console.log("Vacuum widget script loaded");
