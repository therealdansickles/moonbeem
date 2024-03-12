---
title: Metadata Smart Properties v1 [Draft]
date: July 2023
author: |
    | Arthur Chiu Rachel Chu
    | Vibe Labs   Vibe Labs
    | arthur@vibe.xyz rachel@vibe.xyz
---

# Abstract

In the continuously evolving domain of digital assets, there's a pressing need to provide creators and developers with tools that allow for greater flexibility, dynamism, and ease of use.

Enter Smart Properties V1 — an innovative metadata schema tailored to fill this gap. By enabling dynamic property updates, Smart Properties is not just an addition to the domain but a necessary evolution. Seamlessly integrating with the tried-and-true ERC721 and ERC1155 metadata standards, it ensures that adaptability does not come at the expense of compatibility.

# 1. Introduction

The emergence of non-fungible tokens (NFTs) has revolutionized the digital assets landscape by providing unique ownership and provenance for various digital items. The traditional ERC721 NFT standard has helped bridge static details into the digital realm, but has been restrictive in introducing  interactivity and customization. While the ERC721 and ERC1155 standards have laid a robust foundation for representing ownership of unique assets on the blockchain, the static nature of their metadata has posed limitations for use cases that require a dynamic approach. Smart Properties V1 comes into play by offering a solution to this challenge by proposing a schema that builds transparency and calculability into the existing standards. The following sections explains the components that make up the dynanism that Smart Properties provide.

# 2. Conditions

Conditions provide a definition on how we want certain property values to react as we evaluate the metadata. This can be used to create a rule engine: a set of conditions that help express how a property should change or update it's value if a rule is met. Additionally, each condition provides context on how it will update the metadata if its rule is satisfied. In the current version, we provide a set of rules that creators can use today, but we anticipate that more rules can be developed with the existing framework.

## 2.1 Rule Condition

Rules are the individual units that comprise the conditions of the metadata. It defines a condition that needs to be fulfilled in order for some update on the metadata to occur. To define a condition, you specify the property that the rule will observe. For example, if we had a property on the metadata called `experience points` whos value is a number like `4`, a rule could check to see if it's greater than a number like `2`. This would satisify the rule and perform the associated update. For V1, we provide some default rules that can be used. For example:

* `greater_than` - checks if the numerical value of the property is greater than the specified rule value.
* `lesser_than`  - checks if the numerical value of the property is less than the specified rule value.
* `equal`        - checks if the numerical value of the property is equal to the specified rule value.
* `not_equal`    - checks if the numerical value of the property is not equal to the specified rule value.
* `match`        - checks if the value of the property is equal to the specified rule value.
* `exists`       - checks if the property exists on the metadata.
* `absent`       - checks if the property does not exists on the metadata.

## 2.1 Rule Update

Rules also specify how the metadata updates itself if a rule condition is fulfilled. Using this update, one can evaluate what the next property value should be. Continuing from the above example, if our `experience points` property condition were fullfilled, we could set another property called `rank` that would be set to the value of `bronze`. Rule update also provides some default actions that can be used to express different types of dynamic changes. For example:

* `add`      - adds a numerical value to an existing numerical property.
* `subtract` - subtracts a numerical value to an existing numerical property.
* `multiply` - multiplies a numerical value to an existing numerical property.
* `divide`   - divides a numerical value to an existing numerical property.
* `set`      - sets a property to the defined value.


## 2.2 Operators

Conditions also need to be able to be compounded with other rules to express more complex logics. You can specify an operator that will convey to metadat evaluators if a condition can be met separately or if all of them are required to be fulfilled before action can be taken. You can specify operators like:

* `and` - Makes sure that all defined conditions are fulfilled. Defined rule actions will not be performed unless they are all fulfilled.
* `or`  - Any of the conditions can be met indepently. Each rule action will run if fulfilled.

# 3. Substitutions

Substitution provides a mechanism to interpolate external data into the metadata property. This exists to some degree with the existing ERC1155 where the `{id}` tag is used to replace with the actual token ID. We expand on this further to allow creators to embed other pieces of data that may be pulled from external contexts. Creators can specify variables or custom keys to have the metadata evaluate where the data will be sourced.

## 3.1 Additional Default Substitions

In addition to `id` representing the token ID, we propose a few more convenient substitutions to ease creator development.

* `owner` - This references the current owner of the token. This will return the `address` of the owner.

* `address` - This references the current tokens contract address.


## 3.2 Evaluating External Data

To evaluate external data, the metadata schema proposes follow the `{identifier}` tag as a way to express where data should be replaced by an external data source. the `identifier` can be any alphanumeric variable name that follows standard Javascript practices: it starts with a letter and contains no spaces. A rendering library will be able to use this variable to interpolate external data to substitute the tag in the metadata. For example, given a property named `points` has a value of `{points}`, we could have that variable pull from a database that has the actual value(in this case `3`) and render the new metadata with the `points` property to equal `3`.

## 3.3 Evaluating Data from Smart Contracts

Evaluating smart contract data is possible by specifying both the contract and method signature. If we wanted to interpolate the USDC balance for a given account, we can specify in the metadata where the contract is, the method we want, and also how to invoke that method.

### `address`

In this case, `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` for the USDC contract on Ethereum.

### `method`

A method signature to call, in this case we want to call `balanceOf(address)`

### `args`

An array of arguments we may want to pass into the method. In this case we have 1 arg which is `["0xSOMEADDRESS"]` would be the value.

With this configuration, we can evaluate the contract call and interpolate the smart contract data.

## Summary

Smart Properties V1 stands as a testament to the endless possibilities of digital asset innovation. By combining dynamic capabilities with ease of use and compatibility, it is set to redefine the boundaries of what can be achieved with digital tokens. As we look to a future where digital assets continue to play an increasingly prominent role, tools like Smart Properties will undoubtedly be instrumental in shaping the landscape.
