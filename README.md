# AppDaemon Dreame Vacuum Control Widget

This AppDaemon custom widget provides an interactive interface to control Dreame vacuum robots, allowing users to select specific rooms for cleaning. It dynamically fetches vacuum and room data from Home Assistant, making it flexible and easy to use.

## Features

*   **Room Selection:** Allows users to select one or more rooms to be cleaned.
*   **Dynamic Vacuum and Room Data:** Fetches vacuum and room information directly from Home Assistant.
*   **MDI icons:** Displays icons for each room based on the `mdi:` name.
*   **Clean UI:** A simple, clean interface for easy navigation and interaction.

## Installation

1.  **Copy Files:** Copy the `vacuum_control.py` to your `<appdaemon_config_dir>/apps/` directory.
2. Copy `vacuum.yaml` to `<appdaemon_config_dir>/custom_widgets/` directory.
3. Copy `basevacuum` directory with `index.html`, `style.css`, `script.js` to `<appdaemon_config_dir>/custom_widgets/`.
4.  **Add App Configuration:**
        Add the following to your `apps.yaml` file:

```yaml
        vacuum_control:
            module: vacuum_control
            class: VacuumControl
```

5.  **Configure the Widget:**
     In your dashboard files add a widget for each of your vacuum cleaners, for example:

```yaml
        layout:
          - vacuum_widget_betty(10x1)
          - vacuum_widget_bjorn(10x1)

        vacuum_widget_betty:
            widget_type: vacuum
            title: Vacuum Control
            entity: vacuum.betty
            widget_style: "background-color: rgba(0, 0, 0, 0.2);"
        vacuum_widget_bjorn:
            widget_type: vacuum
            title: Vacuum Control
            entity: vacuum.bjorn
            widget_style: "background-color: rgba(0, 0, 0, 0.2);"
```

6.  **Restart AppDaemon:** Restart your AppDaemon instance to load the new app.
7.  **Reload Dashboard:** Reload your AppDaemon dashboard to see the new widgets.

## Backend API Endpoints

The AppDaemon app exposes the following API endpoints:

*   `/api/appdaemon/vacuum_info`: Gets information about all available vacuums.
*   `/api/appdaemon/vacuum_rooms?vacuum_id=<vacuum_id>`: Gets the available rooms for a given vacuum ID.
*   `/api/appdaemon/vacuum_start`: Starts cleaning the selected rooms.
*  `/api/appdaemon/vacuum_status?vacuum_id=<vacuum_id>`: Gets the status of the vacuum.

## Widget Configuration

The widget is configured using the following parameters:

*   `entity`: The vacuum entity (e.g., `vacuum.betty`). This parameter is crucial for retrieving the rooms for that specific entity.

## Dependencies

*   AppDaemon
*   Home Assistant
*   Dreame Vacuum Integration (or any other vacuum integration that exposes a `vacuum.clean_segment` service and `rooms` attribute).

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.