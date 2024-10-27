"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: "my-vpc",
    },
});

// Create an Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("my-igw", {
    vpcId: vpc.id,
    tags: {
        Name: "my-igw",
    },
});

// Create a Public Subnet
const publicSubnet = new aws.ec2.Subnet("public-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "ap-southeast-1a", // Change this to your desired AZ
    mapPublicIpOnLaunch: true,
    tags: {
        Name: "public-subnet",
    },
});

// Create a Route Table
const routeTable = new aws.ec2.RouteTable("public-rt", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
        },
    ],
    tags: {
        Name: "public-rt",
    },
});

// Associate the Route Table with the Public Subnet
const routeTableAssociation = new aws.ec2.RouteTableAssociation("public-rta", {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id,
});

// Create a Security Group
const securityGroup = new aws.ec2.SecurityGroup("web-sg", {
    description: "Allow inbound HTTP and SSH traffic",
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"], // For better security, replace with your IP
        }
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    tags: {
        Name: "web-sg",
    },
});

// Create a key pair
const keyPair = new aws.ec2.KeyPair("my-key-pair", {
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDTqWHAEO+oQDeZZbQJYVt/CJJH6kNKrKWD/wurCJUxfZsjVq2hsCAwB8U/wV6ewvprXEYeIaa6awH2FjIEhCWXz5ZA5ubvMpAOiKovLI9LXPoc+5VvSZIP59khe2xgjYT7qw6+0AlkcNMnmLxO7CROfLs8SQlb16qX5zkC0ODhu0Q9JOnghC69a0G5TFTeAHtN462bku4aBN7ppfHVoUBW0udVSWJintzMR91ABcsQsGRu3ercDTvJSNWjlDKwyd0mKRRwpoGKkaEzhnaHOTqsbvdkWaAIQmH5rGQktR9Kga6dobUexGW5UoomIvZirtowuqiBF9OQoQvQQBd3853T root@b27a85468429cf45", // Replace with your public key
});

// Create two EC2 instances
const createEC2Instance = (name, az) => {
    return new aws.ec2.Instance(name, {
        instanceType: "t3.small",
        ami: "ami-04a81a99f5ec58529",  // Change with your ami ID
        subnetId: publicSubnet.id,
        associatePublicIpAddress: true,
        vpcSecurityGroupIds: [securityGroup.id],
        availabilityZone: az,
        keyName: keyPair.keyName,
        tags: {
            Name: name,
        },
    });
};

const instance1 = createEC2Instance("instance-1", "ap-southeast-1a");
const instance2 = createEC2Instance("instance-2", "ap-southeast-1a");

// Export the VPC ID and EC2 instance public IPs
exports.vpcId = vpc.id;
exports.instance1PublicIp = instance1.publicIp;
exports.instance2PublicIp = instance2.publicIp;
