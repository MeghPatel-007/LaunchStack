# LaunchStack learning notes

## Starting the application

- application
- app connection
- configuration
- intial setup

## Express and middleware

- express application obj
- '/' verifies the path and then executes the cb func , req and res are also obj
- middleware
- if i donot put '/' then also it would pass through it
- pass the error to the centralized error handling middleware
- used to prase the req.body

## Routes

- Route Order
- routes of ids or any parameter route should be at last

## Database and SQL

- never make circular dependencies
- ! it is done to prevent sql injection
- to check the db and db_user
- transaction
- transcation started
- best for testing purpose pool connections
- made CWD independent

## Request and response handling

- http handler
- route handler
- http status code and msg
- error status code
- forbidden/permission

## Project phases

- dependency
- not null
- not null => condn
