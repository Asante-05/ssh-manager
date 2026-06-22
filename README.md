# SSH Manager

SSH Manager is a simple command-line utility for managing SSH hosts and keys. It helps users store, organize, and connect to remote servers through SSH with a convenient configuration workflow.

## Features

- Add and remove SSH host entries
- Store host aliases, addresses, usernames, and key paths
- List configured SSH hosts
- Connect to a host using its alias
- Simple configuration in a local file

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ssh-manager.git
   cd ssh-manager
   ```
2. Install dependencies if required by the project.

## Usage

Basic commands:

```bash
ssh-manager add <alias> <host> [username] [key_path]
ssh-manager remove <alias>
ssh-manager list
ssh-manager connect <alias>
```

Example:

```bash
ssh-manager add prod-server 192.168.1.100 ubuntu ~/.ssh/id_rsa
ssh-manager list
ssh-manager connect prod-server
```

## Configuration

SSH Manager stores host entries in a local config file. Update the file manually or use the command interface to maintain entries.

## Contributing

Contributions are welcome. Open an issue or submit a pull request with improvements.

## License

This project is available under the MIT License.