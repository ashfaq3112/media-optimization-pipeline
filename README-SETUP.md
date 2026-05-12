# Setup and Run (Minikube Local)

Prerequisites
- Docker
- Minikube
- kubectl
- Node.js
- A self-hosted GitHub runner configured on the machine (optional for local test)

Quickstart (local Minikube):

1. Start Minikube and enable registry:

```powershell
minikube start --driver=docker
```

2. Create namespace and MongoDB:

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/secrets.yaml
```

3. Build optimizer image locally (imagePullPolicy: Never):

```powershell
cd optimizer
docker build -t optimizer:latest .
# Load into minikube if using a different docker env
minikube image load optimizer:latest
```

4. Run dashboard backend and frontend locally:

```powershell
cd dashboard/backend
npm install
npm start

cd ../frontend
npm install
npm run dev
```

5. Create a test PR that modifies images matching *.png|*.jpg and the GitHub Action will create a Job in Kubernetes that mounts the runner workspace and runs the optimizer.

Notes:
- The GitHub Action expects a self-hosted runner where the workspace path is accessible to the Kubernetes host via hostPath mount. For Minikube testing, run the runner on the same machine as Minikube and adjust `k8s/optimization-job.yaml.template` hostPath.
- Replace secrets in `k8s/secrets.yaml` with real values before applying.
