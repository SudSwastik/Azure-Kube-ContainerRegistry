# Azure Kuberntes Cluster Creation

- Step By step Guide To Setup Azure Kubenetes Cluster, Pulling and Pushing Docker Container To Azure Private Container Registry. Controlling Azure Kubenetes Cluster Through Kubectl and context switching.

>Run the Node Project and Test if is Working by going to localhost:3000
```
$ npm start
```

>If working Correctly. Create a Docker Image of Node Project
```
$ docker build -t aks-docker-node .
```

>List Images
```
$ docker image list
```

>Build The Container
```
$ docker run -p 4000:3000 <imageId>
```
>Test the container
```
$ localhost:4000
```

>Create a kubernetes pod From The Image
- Creates a Deployment as well as service
- Service Type id NodePort so assignment of a random port
```
$ kubectl apply -f node-dev-deployment-service.yml
```

- Run Kubectl get service to get port of service
```
$ localhost:Port(servicePort)
```

# Creation On Azure

>Install Azure Cli
```
$ brew install azure-cli
```
>Login To Azure
```
$ az login
```

>Every Resource In Azure is created in a resource group
- Create a resource group
```
$ az group create -n <ResourceGroupName>  -l australiaeast
```

>Create an Azure Private Container Registry
```
$ az acr  create -n <ContainerRegisteryName> \
-g <ResourceGroupName>  \
-l australiaeast --sku standard
```

>Take The Azure Container Registery Login Server Name
- It is of the form \<Name\>.azurecr.io
```
$ az acr list -o table
```
>Login to Container Registery
```
$ az acr login -n <ContainerRegisteryName>
```

>Create a Production Image
```
$ docker build -t <LoginServerName>/aks-docker-node:v1
```
>Push The Image to Azure Container registery
```
$ docker push <LoginServerName>/aks-docker-node:v1
```
>To Check Image In Azure Registery or Login Through Azure Portal To Check
```
$ az acr repository list -n <ContainerRegisteryName> -o table
```

>Create a Service Principle To Grant access to Azure Kubenetes Cluster
 To Pull Images From Azure Conatiner Registery
- --skip-assignment is used to restrict default permission
```
$ az ad sp create-for-rbac --skip-assignment
```
- Output is Of Form
- Note Down The appId and Password
```
{
  "appId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "displayName": "azure-cli-XXXX-XX-XX-XX-XX-XX",
  "name": "http://azure-cli-XXXX-XX-XX-XX-XX-XX",
  "password": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "tenant": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
}
```
>Assign The Service Principle Read Access To Azure Container Registry
- Retreive The ID of Azure Container Registery and Store In A variable
```
$ acrId=$( az acr show --name <ContainerRegisteryName> \ 
--resource-group <ResourceGroupName> --query "id" --output tsv) 
```
- Provide Service Principle With Read Access

```
$ az role assignment create \
--assignee "<appId of Service Principal>" --role Reader --scope $acrId
```

>Create The Azure Kubenetes Cluster
- Modify accordingly If you get any error wth location or vm size
```
$ az aks create --name <KubernetesClusterName> --resource-group \
<ResourceGroupName> --node-count 1 \
--generate-ssh-keys \
--service-principal  "<appId of Service Principal>" \
--client-secret "<password of Service Principal>" \
--location westus --node-vm-size Standard_A6
```

>Kubectl Point to local Kubenetes cluster
- To Change it to point to Azure Kubenetes
```
$ az aks get-credentials --name  <KubernetesClusterName> \
--resource-group <ResourceGroupName>
```

>Run Prod Yml Files
- Creates Service and deployment in Azure Cluster
- Make sure Image has of Azure Container Login Server Name 
```
$ kubectl apply -f node-deployment-service.yml 
```
- Check The Creation
- Fetch The External Ip and Hit
- ExternalIp:3000
```
$ kubectl get service --watch
```

>To Deply Image. Craete a new Image with V2 version. Deploy To registry and Run Prod Yml with updated Image name
- It will show the latest Change
```
$ <ServiceExternalIp>:3000
```