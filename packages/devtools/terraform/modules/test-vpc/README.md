# test-vpc Module

Provider: aws

## Variables

- **region** (string): AWS region

## Outputs

- **vpc_id**: VPC ID

## Usage

```hcl
module "test-vpc" {
  source = "./modules/test-vpc"

  region = var.region
}
```
