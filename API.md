# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### TwingateConnector <a name="TwingateConnector" id="twingate-connnectors.TwingateConnector"></a>

#### Initializers <a name="Initializers" id="twingate-connnectors.TwingateConnector.Initializer"></a>

```typescript
import { TwingateConnector } from 'twingate-connnectors'

new TwingateConnector(scope: Construct, id: string, props: TwingateConnectorProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#twingate-connnectors.TwingateConnector.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#twingate-connnectors.TwingateConnector.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#twingate-connnectors.TwingateConnector.Initializer.parameter.props">props</a></code> | <code><a href="#twingate-connnectors.TwingateConnectorProps">TwingateConnectorProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="twingate-connnectors.TwingateConnector.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="twingate-connnectors.TwingateConnector.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="twingate-connnectors.TwingateConnector.Initializer.parameter.props"></a>

- *Type:* <a href="#twingate-connnectors.TwingateConnectorProps">TwingateConnectorProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#twingate-connnectors.TwingateConnector.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="twingate-connnectors.TwingateConnector.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#twingate-connnectors.TwingateConnector.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="twingate-connnectors.TwingateConnector.isConstruct"></a>

```typescript
import { TwingateConnector } from 'twingate-connnectors'

TwingateConnector.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="twingate-connnectors.TwingateConnector.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#twingate-connnectors.TwingateConnector.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#twingate-connnectors.TwingateConnector.property.connectorSecurityGroup">connectorSecurityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="twingate-connnectors.TwingateConnector.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `connectorSecurityGroup`<sup>Required</sup> <a name="connectorSecurityGroup" id="twingate-connnectors.TwingateConnector.property.connectorSecurityGroup"></a>

```typescript
public readonly connectorSecurityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup

---


## Structs <a name="Structs" id="Structs"></a>

### TwingateConnectorProps <a name="TwingateConnectorProps" id="twingate-connnectors.TwingateConnectorProps"></a>

#### Initializer <a name="Initializer" id="twingate-connnectors.TwingateConnectorProps.Initializer"></a>

```typescript
import { TwingateConnectorProps } from 'twingate-connnectors'

const twingateConnectorProps: TwingateConnectorProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#twingate-connnectors.TwingateConnectorProps.property.twingateUrl">twingateUrl</a></code> | <code>string</code> | The Twingate URL to connect to. |
| <code><a href="#twingate-connnectors.TwingateConnectorProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC to deploy the connector into. |
| <code><a href="#twingate-connnectors.TwingateConnectorProps.property.connectorCount">connectorCount</a></code> | <code>number</code> | The number of connectors to deploy. |
| <code><a href="#twingate-connnectors.TwingateConnectorProps.property.instanceRole">instanceRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | An optional instance role to use for the EC2 instances. |
| <code><a href="#twingate-connnectors.TwingateConnectorProps.property.instanceType">instanceType</a></code> | <code>aws-cdk-lib.aws_ec2.InstanceType</code> | An instance type to use for the ec2 instances. |
| <code><a href="#twingate-connnectors.TwingateConnectorProps.property.securityGroup">securityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | An optional securityGroup which will be attached to the EC2 instance security groups. |

---

##### `twingateUrl`<sup>Required</sup> <a name="twingateUrl" id="twingate-connnectors.TwingateConnectorProps.property.twingateUrl"></a>

```typescript
public readonly twingateUrl: string;
```

- *Type:* string

The Twingate URL to connect to.

---

*Example*

```typescript
https://example.twingate.com
```


##### `vpc`<sup>Required</sup> <a name="vpc" id="twingate-connnectors.TwingateConnectorProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

The VPC to deploy the connector into.

---

##### `connectorCount`<sup>Optional</sup> <a name="connectorCount" id="twingate-connnectors.TwingateConnectorProps.property.connectorCount"></a>

```typescript
public readonly connectorCount: number;
```

- *Type:* number
- *Default:* 2

The number of connectors to deploy.

---

##### `instanceRole`<sup>Optional</sup> <a name="instanceRole" id="twingate-connnectors.TwingateConnectorProps.property.instanceRole"></a>

```typescript
public readonly instanceRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A new role will be created

An optional instance role to use for the EC2 instances.

---

##### `instanceType`<sup>Optional</sup> <a name="instanceType" id="twingate-connnectors.TwingateConnectorProps.property.instanceType"></a>

```typescript
public readonly instanceType: InstanceType;
```

- *Type:* aws-cdk-lib.aws_ec2.InstanceType
- *Default:* InstanceType.of(InstanceClass.BURSTABLE3_AMD, InstanceSize.MICRO)

An instance type to use for the ec2 instances.

---

##### `securityGroup`<sup>Optional</sup> <a name="securityGroup" id="twingate-connnectors.TwingateConnectorProps.property.securityGroup"></a>

```typescript
public readonly securityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup
- *Default:* A new security group will be created

An optional securityGroup which will be attached to the EC2 instance security groups.

---

### UserDataProps <a name="UserDataProps" id="twingate-connnectors.UserDataProps"></a>

#### Initializer <a name="Initializer" id="twingate-connnectors.UserDataProps.Initializer"></a>

```typescript
import { UserDataProps } from 'twingate-connnectors'

const userDataProps: UserDataProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#twingate-connnectors.UserDataProps.property.secretName">secretName</a></code> | <code>string</code> | *No description.* |
| <code><a href="#twingate-connnectors.UserDataProps.property.twingateUrl">twingateUrl</a></code> | <code>string</code> | *No description.* |

---

##### `secretName`<sup>Required</sup> <a name="secretName" id="twingate-connnectors.UserDataProps.property.secretName"></a>

```typescript
public readonly secretName: string;
```

- *Type:* string

---

##### `twingateUrl`<sup>Required</sup> <a name="twingateUrl" id="twingate-connnectors.UserDataProps.property.twingateUrl"></a>

```typescript
public readonly twingateUrl: string;
```

- *Type:* string

---



