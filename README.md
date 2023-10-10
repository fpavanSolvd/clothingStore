# API Documentation for Clothing Store App

## Task
Create an online clothing store where customers can search for specific clothing items in their size. The system should provide a list of available products matching the search criteria.


## `api/v1/users` 👤

- ### `GET api/v1/users`

    Returns all users.

    | Query Param   | Type   | Required | Description | Example |
    | ------------- | ------ | :------: | ----------- | ------- |
    | `userType`        | String | No     | If you want to filter by a specific  user type, you can specify it | `api/v1/users?userType=admin`

    ```json
    HTTP 200 OK
    [
        {
            "id": "1",
            "name": "Sam Thompson",
            "email": "sam.thompson@example.com",
            "userType": "admin"
        },
        {
            "id": "2",
            "name": "Sara Perez",
            "email": "sara.perez@example.com",
            "userType": "customer"
        }
    ]
    ```

- ### `GET api/v1/users/:userId`

    Returns a specific user.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `userId`        | String | Yes     | Id of the user |


    ```json
    Example api/v1/users/1
    HTTP 200 OK 
    {
        "id": "1",
        "name": "Sam Thompson",
        "email": "sam.thompson@example.com",
        "userType": "admin"
    }

    If user is not found
    HTTP 404 NOT FOUND
    {
        "error": "User with id {id} not found."
    }
    ```

- ### `PUT api/v1/users/:userId`

    Updates properties of given user and returns updated user.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `userId`        | String | Yes     | Id of the user |

    Body should include properties to be updated.

    Request body example:
    ```json
    {
        "email": "sam_thompson@example.com"
    }
    ```

    ```json
    Example api/v1/users/1
    HTTP 200 OK 
    {
        "id": "1",
        "name": "Sam Thompson",
        "email": "sam_thompson@example.com",
        "userType": "admin"
    }

    If user is not found
    HTTP 404 NOT FOUND
    {
        "error": "User with id {id} not found."
    }
    ```

- ### `POST api/v1/users`

    Creates a new user and return created object.
    
    Body should include required properties. 
    ```json
    {
        "id": "3",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "userType": "customer"
    }
    ```
    ```json
    HTTP 200 OK
    {
        "id": "3",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "userType": "customer"
    }

    If some part of the request body is invalid or missing
    HTTP 400 BAD REQUEST
    {
        "errors": "UserType must be admin or customer"
    }
    ```

- ### `DELETE api/v1/users/:userId` 

    Deletes a given user.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `userId`        | String | Yes     | Id of the user | 

    ```json
    HTTP 204 NO CONTENT

    If user not found
    HTTP 404 NOT FOUND
    {
        "error": "User with id {id} not found."
    }
    ```

## `api/v1/products` 👔

- ### `GET api/v1/products`

    Returns all products with available stock. Optionally different filters can be specified using query params.

    | Query Param   | Type   | Required | Description | Example |
    | ------------- | ------ | :------: | ----------- | ------- |
    | `category`        | String | No     | Product category, e.g. "Tops" | `api/v1/products?category=tops` |
    | `color` | String | No | Product color, e.g. "Red" |  `api/v1/products?color=red` | 
    | `size` | String | No | Product size, e.g "XXL" |  `api/v1/products?size=xxl` |
    | `priceMin` | Number | No | Minimum price, will return only products more expensive than it |  `api/v1/products?priceMin=3` |
    | `priceMax` | Number | No | Maximum price, will return only products cheaper than it |  `api/v1/products?priceMax=10` |

    These filters can be combined in any way, and multiple values are allowed for `category`, `color` and `size`.

    ```json
    HTTP 200 OK
    [
        {
            "id": "1",
            "category": ["tops", "t-shirts"],
            "price": 15,
            "options": {
                "pink": {
                    "s": 3,
                    "xl": 2
                }
            }
        },
        {
            "id": "2",
            "category": ["bottoms", "skirts"],
            "price": 20,
            "options": {
                "blue": {
                    "s": 1,
                    "m": 2
                },
                "purple": {
                    "xs": 6,
                    "l": 2
                }
            }
        },
        ...
    ]
    ```

- ### `GET api/v1/products/:productId`

    Returns a specific product.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `productId`        | String | Yes     | Id of the product | 

    ```json
    Example api/v1/products/1
    HTTP 200 OK
    {
        "id": "1",
        "category": ["tops", "t-shirts"],
        "price": 15,
        "options": {
            "pink": {
                "s": 3,
                "xl": 2
            }
        }
    }

    If product not found
    HTTP 404 NOT FOUND
    {
        "errors": "product with id {id} not found"
    }
    ```

- ### `PUT api/v1/products/:productId`

    Updates a given product and returns updated version.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `productId`        | String | Yes     | Id of the product | 

    Request body should include properties to be updated.
    Example:
    ```json
    {
        "price": 5
    }
    ```

    ```json
    HTTP 200 OK
    {
        "id": "1",
        "category": ["tops", "t-shirts"],
        "price": 5,
        "options": {
            "pink": {
                "s": 3,
                "xl": 2
            }
        }
    }

    If product not found
    HTTP 404 NOT FOUND
    {
        "errors": "product with id {id} not found"
    }
    ```

- ### `POST api/v1/products`

    Adds a new product and returns created item.

    Request body should include required properties: id, category, price. Products can be created without options, which can be added later.
    Example:
    ```json
    {
        "id": "3",
        "category": ["dresses"],
        "price": 13
    }
    ```

    ```json
    HTTP 200 OK
    {
        "id": "3",
        "category": ["dresses"],
        "price": 13,
        "options": {}
    }

    If there is an issue with the request body
    HTTP 400 BAD REQUEST
    {
        "errors": "Product price is required"
    }
    ```

- ### `DELETE api/v1/products/:productId`

    Deletes a given product

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `productId`        | String | Yes     | Id of the product | 

    ```json
    HTTP 204 NO CONTENT

    If product not found
    HTTP 404 NOT FOUND
    {
        "error": "Product with id {id} not found."
    }
    ```

## `api/v1/products/:productId/options` 📃

- ### `POST api/v1/products/:productId/options`

    Adds option to a given product. Returns product with new option added. If option color already exits for that product but size does not it adds the new size. If size already exists it adds given amount to existing size stock.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `productId`        | String | Yes     | Id of the product | 

    Request body should include required properties:  color, size, stock.
    Example:
    ```
    {
        "red": {
            "s": 2
        }
    }
    ```

    ```json
    HTTP 200 OK
    {
        "id": "3",
        "category": ["dresses"],
        "price": 13,
        "options": {
            "red": {
                "s": 2
            }
        }
    }

    If the product is not found
    HTTP 404 BAD REQUEST
    {
        "errors": "Product not found"
    }
    ```

- ### `DELETE api/v1/products/:productId/options/:color`

    Deletes a given option from a product.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `productId`        | String | Yes     | Id of the product | 
    | `color` | String | Yes | Color that identifies the option |

    Optionally size can be specified, in this case only given size will be deleted from the option, not the whole option. If there are no remaining sizes, the whole option will be deleted.

    | Query Param   | Type   | Required | Description | Example |
    | ------------- | ------ | :------: | ----------- | ------- |
    | `size`        | String | No     | Product option size, e.g. "xl" | `api/v1/products/3/options/red?size=xl` |

    ```json
    HTTP 204 NO CONTENT

    If product or option not found
    HTTP 404 NOT FOUND
    {
        "error": "Product with id {id} not found."
    }
    ```

## `api/v1/carts` 🛒

- ### `POST api/v1/carts/:userId`

    Creates a cart for a given user. Returns created cart. A cart is initially created without products.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `userId`        | String | Yes     | Id of the user | 

    ```json
    HTTP 200 OK
    {   
        "cartId": "1",
        "userId": "1",
        "products": []
    }

    If user not found
    HTTP 404 NOT FOUND
    {
        "error": "User with id {id} not found."
    }
    ```

- ### `PUT api/v1/carts/:cartId`

    Adds a product to a cart. Returns updated cart.
    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `cartId`        | String | Yes     | Id of the cart | 

    Request body should include productId and option details (color, size, product amount). Example:
    ```json
    {
        "productId": "2",
        "blue": {
            "s": 1
        }
    }
    ```

    ```json
    HTTP 200 OK
    {
        "cartId": "1",
        "userId": "1",
        "products": [
            {
                "productId": "2",
                "blue": {
                    "s": 1
                }
            }
        ]
    }

    If cart not found
    HTTP 404 NOT FOUND
    {
        "error": "Cart with id {id} not found."
    }

    If there is an issue with the body (product not found, option doesn't exist,not enough stock)
    HTTP 400 BAD REQUEST
    {
        "error": "Not enough stock of product {productId} in color {optionColor}"
    }
    ```

- ### `GET api/v1/carts/:cartId`

    Returns a given cart.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `cartId`        | String | Yes     | Id of the cart | 

    ```json
    HTTP 200 OK
    {
        "cartId": "1",
        "userId": "1",
        "products": [
            {
                "productId": "2",
                "blue": {
                    "s": 1
                }
            }
        ]
    }

    If cart not found
    HTTP 404 NOT FOUND
    {
        "error": "Cart with id {id} not found."
    }
    ```

- ### `DELETE api/v1/carts/:cartId`

    Deletes a given cart.

    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `cartId`        | String | Yes     | Id of the cart |     

    ```json
    HTTP 204 NO CONTENT

    If cart not found
    HTTP 404 NOT FOUND
    {
        "error": "Cart with id {id} not found."
    }
    ```

- ### `DELETE api/v1/carts/:cartId/buy`

    Buys a cart. Subtracts stocks from inventory and deletes cart.
    
    | Request Param | Type   | Required | Description |
    | ------------- | ------ | :------: | ----------- |
    | `cartId`        | String | Yes     | Id of the cart |     

    ```json
    HTTP 204 NO CONTENT

    If cart not found
    HTTP 404 NOT FOUND
    {
        "error": "Cart with id {id} not found."
    }
    ```