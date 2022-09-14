import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AzurermProvider, VirtualNetwork, ResourceGroup, LinuxVirtualMachine, Subnet, NetworkInterface } from "./.gen/providers/azurerm"
import { RandomProvider, Password } from "./.gen/providers/random"

class AzureAppInfra extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);


    new AzurermProvider(this, "AzureRm", {
      features: {}
    })

    new RandomProvider(this, "RandomProvider")

    let rg = new ResourceGroup(this, "rg-example", {
      name: "example-resource-group",
      location: "eastus"
    })
    let vnet = new VirtualNetwork(this, "vnet-example", {
      name: "example-network",
      location: rg.location,
      addressSpace: ["10.0.0.0/16"],
      resourceGroupName: rg.name
    })
    let subnet = new Subnet(this, "subnet-example", {
      name: "example-subnet",
      resourceGroupName: rg.name,
      virtualNetworkName: vnet.name,
      addressPrefixes: ["10.0.2.0/24"]
    })
    let network_interface = new NetworkInterface(this, "ni-example", {
      name: "example-nic",
      resourceGroupName: rg.name,
      location: rg.location,
      ipConfiguration: [{
        name: "internal",
        subnetId: subnet.id,
        privateIpAddressAllocation: "Dynamic"
      }]
    })

    const password = new Password(this, "RandomPassword", {
      length: 16,
      special: true,
      overrideSpecial: "!#$%&*()-_=+[]{}<>:?"
    })
    new LinuxVirtualMachine(this, 'Web-Server', {
      name: "Web-App-1",
      resourceGroupName: rg.name,
      adminUsername: "demoUser",
      adminPassword: password.result,
      disablePasswordAuthentication: false,
      size: "Standard_F2",
      location: rg.location,
      networkInterfaceIds: [
        network_interface.id
      ],
      osDisk: {
        caching: "ReadWrite",
        storageAccountType: "Standard_LRS"
      },
      sourceImageReference: {
        publisher: "Canonical",
        offer: "UbuntuServer",
        sku: "16.04-LTS",
        version: "latest"
      }
    })

  }
}
const app = new App();
new AzureAppInfra(app, 'cdk');
app.synth();