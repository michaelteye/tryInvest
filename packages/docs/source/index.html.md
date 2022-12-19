---
title: API Reference

language_tabs: # must be one of https://git.io/vQNgJ
  - shell
  - javascript

includes:
  - errors

search: true

code_clipboard: true

meta:
  - name: description
    content: Documentation for the BezoSusu API
---

# Introduction

Welcome to the BezoSusu API V2. This documentation explains how you can access and use this API for building BezoSusu clients such as the mobile, USSD and web applications.

We provide documentation on how to consume the API using raw HTTP requests (cURL) and using our official BezoSusu SDK. You can view code examples in the dark area to the right, and you can switch the programming language of the examples with the tabs in the top right.

# Authentication

This module of the documentation covers everything you need to register new users, login, logout and get details about authenticated users. Authentication for the mobile and web clients are done via access token and refresh token pairs. To make authenticated requests to the API, you would need to provide an access token in an Authorization header of your request. Here's an example:

`Authorization: Bearer xxxx`

<aside class="notice">
You must replace <code>xxxx</code> with the JWT access token of the user performing this authenticated request.
</aside>

Making unauthenticated requests to secure endpoints would result in a `401 Unauthorized` HTTP error.

## Registration

Use this endpoint to add new users to BezoSusu.

### Http request

`POST https://api.bezomoney.com/v2/users`

### Attributes

| Attribute    | Required | Description                                                                                                                                                                                             |
| :----------- | -------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| first_name   | No       | First name of the user                                                                                                                                                                                  |
| last_name    | No       | Last name of the user                                                                                                                                                                                   |
| phone_number | Yes      | A valid ghanian phone number in the international number format                                                                                                                                         |
| password     | No       | A password for the new user signing up. If provided, must be at least 12 characters long and contain numbers, characters and capital letters.                                                           |
| platform_id  | Yes      | The platform making this API call. This would be the ID of the mobile client or web application client for now. In future if we have more platforms, they will be acceptable options to this attribute. |

> To register a user, use below api:

```shell
curl https://api.bezomoney.com/v2/users \
  -d first_name=Stuart \
  -d last_name=Billings \
  -d phone_number=233244322136 \
  -d password=Phai7thei5y \
  -d platform_id=pltfm_1DqyFs2eZvKYlo2C9ZVqxUhp
```

```javascript
import { Bezomoney, Platforms } from "@bezomoney/sdk";

const bezomoney = new Bezomoney();

const [error, { access_token, refresh_token }] = await bezomoney.users.create({
  first_name: "Stuart",
  last_name: "Billings",
  phone_number: "233244322136",
  password: "Phai7thei5y",
  platform: Platforms.Web,
});
```

> Success Response:

```shell
{
   "access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
   "refresh_token":"eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTg1ODYzIiwibmFtZSI6IkpvaG4gRG9lIE1heGltdXNpIiwiaWF0IjoxMjIzM30.C9fb7gPKl_zFJ_Cr5iFWOGjAbiiYF3JPA5x14I2LynIEbH7BcmStiaFWnKbDYSZS"
}
```

```javascript
{
   "access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
   "refresh_token":"eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTg1ODYzIiwibmFtZSI6IkpvaG4gRG9lIE1heGltdXNpIiwiaWF0IjoxMjIzM30.C9fb7gPKl_zFJ_Cr5iFWOGjAbiiYF3JPA5x14I2LynIEbH7BcmStiaFWnKbDYSZS"
}
```

> Failed Response:

```shell
HTTP/1.1 422 Unprocessable entity
Content-Type: application/json

{
  "phone_number": "The phone number is already taken.",
  "password": "The password must contain uppercase characters."
}
```

```javascript
{
  "phone_number": "errors.validation.phone_number_taken",
  "password": "errors.validation.invalid_password"
}
```


## Login

To login, you will need to pass phone and password to the tokens api,also users have the option of passing a verified pin or otp to login.A successful login will respond with users access token and refresh token respectively.

### Http request

`POST https://api.bezomoney.com/v2/tokens`

### Attributes

| Attribute     | Required       | Description                                                             |
| :------------ | :------------- | :---------------------------------------------------------------------- |
| phone_number         |    Yes         | user phone which should take the international format `233xxxxxxx`      |
| password      |    Yes         | password should be varchar format which should be 4 characters minimum  |
| otp           |    Yes         | An otp for phone verification and also can be used to login.Otp should be varchar format wich should be 8 characters minimum  |

 >Login with Phone and Password

```shell

curl https://api.bezomoney.com/v2/tokens
-H "Content-Type: application/json"
-d phone_number=233244322136 \
-d password=m*^sasdla \
-X POST

```



```javascript
import { Bezomoney } from "@bezomoney/sdk";

const bezomoney = new Bezomoney();

const [error, { access_token, refresh_token }] = bezomoney.tokens({
  phone_number: "2335234523454",
  password: "sSDGks8)!",
});

```

 > Login with Phone and Otp

```shell

curl https://api.bezomoney.com/v2/tokens
-H "Content-Type: application/json"
-d phone_number=m*^sasdla \
-d otp=23556 \
-X POST

```

```javascript

import { Bezomoney } from "@bezomoney/sdk";

const bezomoney = new Bezomoney();

const [error, { access_token, refresh_token }] = bezomoney.tokens({
  phone_number: "2335234523454",
  otp:   "38399",
});


```

> Success Response

```javascript
{

    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJsYXN0bmFtZSI6Imtvam8gYXRvIn0.cAog2weBcj6JgTBhZQtfrDnS06XXwv8H19e3NBBxR-E"

}

```

```shell
HTTP/1.1 201 Created
Content-Type: application/json

{
   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJsYXN0bmFtZSI6Imtvam8gYXRvIn0.cAog2weBcj6JgTBhZQtfrDnS06XXwv8H19e3NBBxR-E"
}

```

> Failed Response

```javascript
{
  "error": "errors.codes.unauthenticated",
}

```

```shell
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "errors.codes.unauthenticated",
}

```


## Refresh Token

To refresh expired access token , the refresh token api is called.Refresh token is passed as the parameter to access new access token

### Http request

`POST https://api.bezomoney.com/v2/refresh_token`

```shell
curl https://api.bezomoney.com/v2/refresh_token
-H "Authorization: Bearer xxx"
-H "Content-Type: application/json"
-d refresh_token=eyJadadfasdfASDFASDFafdadsfadsAFDAAFSDFASFASFeyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c \
-X POST

```

```javascript
import { Bezomoney } from "@bezomoney/sdk";

const bezomoney = new Bezomoney()
const [error, {refresh_token}] = await bezomoney.auth.refreshToken();
```

> Success Response

```javascript

{

  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "access_token": "CJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}

```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJzYW1wbGUiOiJhbm90aGVyIG1lc3NhZ2UifQ._LfEj5r1_a1gpXbCBa6vXnSWZH8UDjxAXSphSLvYn6g",
  "refresh_token": "YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJzYW1wbGUiOiJhbm90aGVyIG1lc3NhZ2UifQ._LfEj5r1_a1gpXbCBa6vXnSWZH8UDjxAXSphSLvYn6g"
}

```

> Failed Response

```javascript

{
  "error": "errors.codes.unauthenticated",

}

```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "errors.codes.unauthenticated",
}

```

## Authenticated user

To access current loged in user, with associated user data, the auth/me api is called.To successfully execute this api, you pass access_token to get authenticated user data.

```shell

curl https://api.bezomoney.com/v2/auth/me
-H "Authorization: Bearer xxx"
-H "Content-Type: application/json"
-X GET

```

```javascript

import { Bezomoney } from "@bezomoney/sdk";

const bezomoney = new Bezomoney({
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
})

const [error, { id, first_name, last_name }] = await bezomoney.auth.me();

```

> Success Response

```javascript
{

  "id": "user_1Dr1S92eZvKYlo2CrWdcRnWr"
  "first_name": "Patrick",
  "last_name": "Oduro",
  "phone_number": [
    {
      "id": "pho_1Dr1S92eZvKYlo2CrWdcRnWr",
      "number":"233542853413",
      "status":"active",
      "network": "glo",
      "verified_at": "2022-03-27 12:58:14",
      "created_at": "2022-03-27 12:58:14",
      "updated_at": "2022-03-27 12:58:14"
    },
    {
      "id": "pho_1Dr1S92eZvKYlo2CrWdcRnWr",
      "number":"233542855417",
      "status":"disabled",
      "network": "mtn",
      "verified_at": "2022-03-27 12:58:14",
      "created_at": "2022-03-27 12:58:14",
      "updated_at": "2022-03-27 12:58:14"
    }
  ],
  "addresses": [{
    "id": "addr_1Dr1S92eZvKYlo2CrWdcRnWr",
    "home_address": "HQ9W+MWM, 3rd Cres",
    "country": "Ghana",
    "region": "Accra",
    "gps_address": "HQ9W+MWM, 3rd Cres",
    "created_at": "2022-03-27 12:58:14",
    "updated_at": "2022-03-27 12:58:14"
  }],
  "level": {
    "id": "lvl_1Dr1S92eZvKYlo2CrWdcRnWr",
    "name": "beginner",
    "withdrawal_limit": 2000.00,
    "deposit_limit": 5000.00
  }
}
```

```shell
HTTP/1.1 200 Ok
Content-Type: application/json

{

  "id": "user_1Dr1S92eZvKYlo2CrWdcRnWr"
  "first_name": "Patrick",
  "last_name": "Oduro",
  "phone_number": [
    {
      "id": "pho_1Dr1S92eZvKYlo2CrWdcRnWr",
      "number":"233542853413",
      "status":"active",
      "network": "glo",
      "verified_at": "2022-03-27 12:58:14",
      "created_at": "2022-03-27 12:58:14",
      "updated_at": "2022-03-27 12:58:14"
    },
    {
      "id": "pho_1Dr1S92eZvKYlo2CrWdcRnWr",
      "number":"233542855417",
      "status":"disabled",
      "network": "mtn",
      "verified_at": "2022-03-27 12:58:14",
      "created_at": "2022-03-27 12:58:14",
      "updated_at": "2022-03-27 12:58:14"
    }
  ],
  "addresses": [{
    "id": "addr_1Dr1S92eZvKYlo2CrWdcRnWr",
    "home_address": "HQ9W+MWM, 3rd Cres",
    "country": "Ghana",
    "region": "Accra",
    "gps_address": "HQ9W+MWM, 3rd Cres",
    "created_at": "2022-03-27 12:58:14",
    "updated_at": "2022-03-27 12:58:14"
  }],
  "level": {
    "id": "lvl_1Dr1S92eZvKYlo2CrWdcRnWr",
    "name": "beginner",
    "withdrawal_limit": 2000.00,
    "deposit_limit": 5000.00
  }
}
```

> Failed Response

```javascript
{
   "error": "errors.codes.unauthenticated"
}
```

```shell
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "errors.codes.unauthenticated"
}

```

## Reset Password

To reset password:

- Call create otp [endpoint](#otps) to send an OTP.


- Call the passwords/reset endpoint with a new password and the OTP. The endpoint receives a password and OTP, verifies the OTP, then updates the user's password and returns a 201 if all goes well. the frontend user experience won't change.


### Http request

`POST https://api.bezomoney.com/v2/paswords/reset`



### Attributes

| Attribute     | Required       | Description                                                             |
| :------------ | :------------- | :---------------------------------------------------------------------- |
| password         |    Yes         | password should be varchar format which should be 4 characters minimum       |
| otp         |    Yes         | a one time password sent to your phone        |



 >Reset password with password and otp

```shell

curl https://api.bezomoney.com/v2/passwords/reset
-H "Content-Type: application/json"
-d password=345767^*33# \
-d otp=353579\
-X POST

```



```javascript

import { Bezomoney } from "@bezomoney/sdk";

const bezomoney = new Bezomoney();
const [error] = bezomoney.passwords.reset({password: "345767^*33#",otp: '353579'});

```

> Success Response

```javascript

{}

```

```shell
HTTP/1.1 201 Created
Content-Type: application/json

```

> Failed Response

```javascript
{
  "error": "errors.validation.invalid_password" ,
}

```

```shell
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "errors.validation.invalid_password",
}

```




# Otps

## Create Otp

Use this endpoint to create an OTP for a user. Behind the scenes, the backend will send a one time 4 digit OTP to the user's connected phone number.

### Http endpoint
`POST https://api.bezomoney.com/v2/otps`

### Attributes

This endpoint has no required attributes. If the user is authenticated, you may call this endpoint with no data. If the user is not authenticated, the phone number will be required.

| Attribute     | Required | Description                                                             |
| :------------ | :------- | ----------------------------------------------------------------------- |
| phone_number  | No       | Only provide the phone number when the user is not authenticated, for example: sending an OTP during the login flow


```shell
curl https://api.bezomoney.com/v2/otps
-H "Authorization: Bearer xxx"
-X GET
```

```javascript
import { Bezomoney } from '@bezomoney/sdk'

const bezomoney = new Bezomoney({
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
})

const [error] = await bezomoney.otps.create()
```

> Success Response

```javascript
{}
```

```shell
HTTP/1.1 204 No content
Content-Type: application/json
```

> Failed Response

```shell
HTTP/1.1 401 Unauthenticated
Content-Type: application/json

{
  "message": "errors.codes.unauthenticated"
}
```

```javascript
{
  "message": "errors.codes.unauthenticated"
}
```

## Verify Otp

To verify users OTP, a one time password is sent to users phone.The verify user otp api requires that the phone number used to call the verify phone number is used in this instance of request.


### Http request

`POST https://api.bezomoney.com/v2/otps/verify`



### Attributes

| Attribute | Description                                                             |
| :-------- | :---------------------------------------------------------------------- |
| phone_number     | user phone which should take the international this format `233xxxxxxx` |
| otp       | a one time password sent to your phone                                  |
| message   | string format which gives brief description of response status          |
| error     | a boolean format or string containing error response code               |

```shell

curl https://api.bezomoney.com/v2/otps/verify
-H "Authorization: Bearer xxx"
-H "Content-Type: application/json"
-d phone_number=233542853413 \
-d otp=2344 \
-X POST

```

```javascript
import { Bezomoney } from "@bezomoney/sdk";

const bezomoney = new Bezomoney();
const [error, {response}] = bezomoney.otps.verify({
   phone_number: "233244322136",
   otp: "2344",
})

```

> Success Response

```javascript
{}
```

```shell

HTTP/1.1 204 Success
Content-Type: application/json

```

> Failed Response

```shell
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "errors.codes.invalid_otp",
}


```

```javascript

{
  "error": "errors.codes.invalid_otp",
}


```


