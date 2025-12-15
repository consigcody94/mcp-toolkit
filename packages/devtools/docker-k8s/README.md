# 🚀 Infrastructure Pilot

**Control Docker and Kubernetes with natural language through Claude Desktop**

Infrastructure Pilot is an MCP (Model Context Protocol) server that bridges Claude Desktop with your infrastructure. Manage containers, pods, deployments, and services using natural language—no need to remember complex commands.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### Docker Management
- **Container Operations**: List, start, stop, restart, remove, create containers
- **Image Management**: List, pull, remove images
- **Volume & Network Control**: List volumes and networks
- **Real-time Stats**: CPU, memory, network, block I/O metrics
- **Log Streaming**: Container logs with tail support

### Kubernetes Management
- **Pod Operations**: List, get, delete, logs, exec
- **Deployment Control**: List, get, scale, restart, delete
- **Service Management**: List and inspect services
- **Node Monitoring**: Cluster node status and metrics
- **Namespace Operations**: List, create, delete namespaces

### Unified Experience
- **27 MCP Tools**: Complete infrastructure management
- **Natural Language**: "Scale my deployment to 5 replicas"
- **Beautiful Output**: Markdown-formatted responses with tables and emojis
- **Error Handling**: Clear error messages and recovery guidance

## 🚀 Quick Start

### Prerequisites

- **Claude Desktop** installed
- **Node.js** 16+ and npm
- **Docker** (optional - for Docker features)
- **Kubernetes cluster** (optional - for K8s features)

### Installation

```bash
# Clone the repository
git clone https://github.com/consigcody94/infra-pilot.git
cd infra-pilot

# Install dependencies
npm install

# Build the project
npm run build
```

### Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "infra-pilot": {
      "command": "node",
      "args": ["/absolute/path/to/infra-pilot/dist/mcp-server.js"]
    }
  }
}
```

### Restart Claude Desktop

Completely quit and reopen Claude Desktop to load the MCP server.

## 💬 Usage Examples

### Docker Operations

```
"Connect to Docker and list all containers"
→ Shows running and stopped containers with status

"Show logs for container nginx"
→ Displays last 100 lines of container logs

"Restart the api-server container"
→ Restarts the specified container

"What containers are using the most CPU?"
→ Shows resource statistics for containers

"Pull the latest nginx image"
→ Downloads nginx:latest from Docker Hub
```

### Kubernetes Operations

```
"Connect to Kubernetes and list all pods"
→ Shows pods in default namespace with status

"Scale deployment web-app to 5 replicas"
→ Scales the deployment to 5 instances

"Show me all pods in the production namespace"
→ Lists pods in specific namespace

"Get logs from pod web-app-7d4f6b8c9-xk2m4"
→ Displays pod logs

"What's the status of my nodes?"
→ Shows cluster node health and capacity

"Restart the frontend deployment"
→ Performs rolling restart

"Create a namespace called staging"
→ Creates new Kubernetes namespace
```

## 🛠️ Available Tools

### Connection Tools

#### `connect_docker`
Connect to Docker daemon.

**Parameters**:
- `socketPath` (optional): Docker socket path (default: `/var/run/docker.sock`)
- `host` (optional): Docker daemon host
- `port` (optional): Docker daemon port

#### `connect_kubernetes`
Connect to Kubernetes cluster.

**Parameters**:
- `kubeconfig` (optional): Path to kubeconfig file
- `context` (optional): Kubernetes context to use
- `namespace` (optional): Default namespace (default: `default`)

### Docker Container Tools

#### `docker_list_containers`
List all Docker containers.

**Parameters**:
- `all` (boolean, optional): Include stopped containers (default: true)

#### `docker_start_container`
Start a Docker container.

**Parameters**:
- `nameOrId` (required): Container name or ID

#### `docker_stop_container`
Stop a Docker container.

**Parameters**:
- `nameOrId` (required): Container name or ID
- `timeout` (optional): Timeout in seconds (default: 10)

#### `docker_restart_container`
Restart a Docker container.

**Parameters**:
- `nameOrId` (required): Container name or ID

#### `docker_remove_container`
Remove a Docker container.

**Parameters**:
- `nameOrId` (required): Container name or ID
- `force` (boolean, optional): Force removal

#### `docker_container_logs`
Get container logs.

**Parameters**:
- `nameOrId` (required): Container name or ID
- `tail` (optional): Number of lines (default: 100)

#### `docker_container_stats`
Get container resource statistics.

**Parameters**:
- `nameOrId` (required): Container name or ID

### Docker Image Tools

#### `docker_list_images`
List all Docker images.

#### `docker_pull_image`
Pull a Docker image.

**Parameters**:
- `imageName` (required): Image name (e.g., `nginx:latest`)

#### `docker_remove_image`
Remove a Docker image.

**Parameters**:
- `nameOrId` (required): Image name or ID
- `force` (boolean, optional): Force removal

### Docker Volume & Network Tools

#### `docker_list_volumes`
List all Docker volumes.

#### `docker_list_networks`
List all Docker networks.

### Kubernetes Pod Tools

#### `k8s_list_pods`
List Kubernetes pods.

**Parameters**:
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_get_pod`
Get a specific pod.

**Parameters**:
- `name` (required): Pod name
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_delete_pod`
Delete a pod.

**Parameters**:
- `name` (required): Pod name
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_pod_logs`
Get pod logs.

**Parameters**:
- `name` (required): Pod name
- `namespace` (optional): Namespace (default: `default`)
- `container` (optional): Container name
- `tail` (optional): Number of lines (default: 100)

### Kubernetes Deployment Tools

#### `k8s_list_deployments`
List deployments.

**Parameters**:
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_get_deployment`
Get a specific deployment.

**Parameters**:
- `name` (required): Deployment name
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_scale_deployment`
Scale a deployment.

**Parameters**:
- `name` (required): Deployment name
- `replicas` (required): Number of replicas
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_restart_deployment`
Restart a deployment (rolling restart).

**Parameters**:
- `name` (required): Deployment name
- `namespace` (optional): Namespace (default: `default`)

### Kubernetes Service Tools

#### `k8s_list_services`
List services.

**Parameters**:
- `namespace` (optional): Namespace (default: `default`)

#### `k8s_get_service`
Get a specific service.

**Parameters**:
- `name` (required): Service name
- `namespace` (optional): Namespace (default: `default`)

### Kubernetes Node Tools

#### `k8s_list_nodes`
List cluster nodes.

#### `k8s_get_node`
Get a specific node.

**Parameters**:
- `name` (required): Node name

### Kubernetes Namespace Tools

#### `k8s_list_namespaces`
List all namespaces.

#### `k8s_create_namespace`
Create a namespace.

**Parameters**:
- `name` (required): Namespace name

### Info Tool

#### `get_info`
Get Docker and Kubernetes connection status.

## 🏗️ Architecture

### Project Structure

```
infra-pilot/
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── docker/
│   │   └── docker-client.ts  # Docker client wrapper
│   ├── kubernetes/
│   │   └── k8s-client.ts     # Kubernetes client wrapper
│   ├── mcp-server.ts         # MCP server implementation
│   └── index.ts              # Public API exports
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Components

**Docker Client** (`docker/docker-client.ts`):
- Wraps `dockerode` library
- Container lifecycle management
- Image operations
- Volume and network management
- Real-time stats and metrics

**Kubernetes Client** (`kubernetes/k8s-client.ts`):
- Wraps `@kubernetes/client-node` library
- Pod operations
- Deployment management
- Service and node operations
- Namespace management

**MCP Server** (`mcp-server.ts`):
- JSON-RPC 2.0 protocol implementation
- 27 MCP tools
- Markdown-formatted responses
- Error handling and recovery

## 🔧 Development

### Setup Development Environment

```bash
git clone https://github.com/consigcody94/infra-pilot.git
cd infra-pilot
npm install
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

## 🐛 Troubleshooting

### "Failed to connect to Docker"

**Cause**: Cannot connect to Docker daemon.

**Solutions**:
1. Ensure Docker is running: `docker ps`
2. Check Docker socket: `ls -l /var/run/docker.sock`
3. Verify user permissions: `groups` (should include `docker`)
4. On macOS: Ensure Docker Desktop is running

### "Failed to connect to Kubernetes"

**Cause**: Cannot connect to Kubernetes cluster.

**Solutions**:
1. Verify kubeconfig: `kubectl config view`
2. Test connection: `kubectl get nodes`
3. Check context: `kubectl config current-context`
4. Verify cluster access: `kubectl cluster-info`

### Tools Not Showing in Claude Desktop

**Cause**: Claude Desktop hasn't loaded the MCP server.

**Solutions**:
1. Check config path is correct
2. Verify absolute path to `mcp-server.js`
3. Completely restart Claude Desktop (Quit, not just close window)
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

### Docker Permission Denied

**Cause**: User lacks permission to access Docker socket.

**Solutions**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or:
newgrp docker

# Verify
docker ps
```

### Kubernetes Context Not Found

**Cause**: Invalid or missing Kubernetes context.

**Solutions**:
```bash
# List contexts
kubectl config get-contexts

# Set context
kubectl config use-context <context-name>

# Verify
kubectl config current-context
```

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Model Context Protocol](https://github.com/anthropics/mcp)
- [Claude Desktop](https://claude.ai/download)
- [dockerode](https://github.com/apocas/dockerode)
- [@kubernetes/client-node](https://github.com/kubernetes-client/javascript)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

Infrastructure Pilot provides powerful control over your infrastructure. Use with caution:

- Only use with trusted Claude Desktop installations
- Review commands before execution when managing production systems
- Limit access to production clusters
- Use RBAC (Role-Based Access Control) in Kubernetes
- Never expose Docker socket or Kubernetes API to untrusted networks

## 🙏 Acknowledgments

- Built with [dockerode](https://github.com/apocas/dockerode) by Pedro Dias
- Built with [@kubernetes/client-node](https://github.com/kubernetes-client/javascript)
- Powered by [Model Context Protocol](https://github.com/anthropics/mcp)

---

**Made with ❤️ for DevOps engineers and developers**
