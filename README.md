# Twingate Connectors

[Twingate](https://www.twingate.com/) is a 0-trust VPN solution for accessing resources within a VPC that are not publicly available.
This project is an AWS CDK construct which could be used to create Twingate connectors in your VPC.

> [!IMPORTANT]
> **This is not a strict endorsement of Twingate. While I've used it before and like it as a solution I'm not paid to promote it.**

## Architecture

The architecture of this construct is based off of [the documentation](https://www.twingate.com/docs/aws#ec2-deployment) provided by Twingate. In this case, it's an EC2 deployment using individual instances.

## Point of Interest

* The [TwingateConnector](./src/TwingateConnector.ts) construct is the single construct in this library. Creating an instance of this will create multiple Twingate connectors in the given VPC.
* Input validation is handled in the first few lines of the construct, ensuring that a `connectorCount` greater than 0 is provided and that the `twingateUrl` appears to be a url (very basic regex check).
* An instance of the [TwingateConnectorShared](./src/TwingateConnectorShared.ts) construct is created as part of the `TwingateConnector` construct and contains any resources that are shared by all the instances, like IAM Instance Profile roles, and SSM patch documents.
* For each connector, an AWS Secrets Manager [Secret](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager.Secret.html) is created to hold that individual connector's access keys to Twingate.
* [UserData](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.UserData.html) is leveraged to read the Secret and do the initial setup of the connector. If either of the secret values are missing, the process waits 30s and then tries again to read the values and set up the connector. This means that after the deployment is done, the operator goes into Twingate, generates the required keys, updates the secrets, and the EC2 instance will detect that update and initialize the connector with Twingate, avoiding the need to manually get a shell on the instance and make any changes. Note, that if your access keys change in the future, this DOES require manual intervention by the operator to open a shell on the instance and update the values manually.
* An [SSM patch document](src/TwingateConnectorShared.ts:66) is created to keep the connectors up to date.
* A security group is attached to the instances and the SG ID is provided as an output of the construct so that it can be easily added to the ingress rules of VPC resources. It's also provided as a public property on the construct.
* Some additional properties are optional for the construct, including the instance types to use, an existing security group to attach to the instances, and an instance role to use instead of creating one.
* I made all the methods protected, so you can inherit from this class and override that functionality easily.
* The construct is covered by unit tests that use [Fine-Grained Assertions](https://docs.aws.amazon.com/cdk/v2/guide/testing.html#testing_fine_grained). I also added a few additional snapshot tests just for fun.

