export class InvalidParamError extends Error {
  constructor(param_name:string){
    super(`Required param '${param_name}' is empty of invalid.`)
    this.name = "InvalidParamError"
  }
}

export class AuthenticationError extends Error {
  constructor(message:string){
    super(message)
    this.name = "AuthenticationError"
  }
}

export class PermissionError extends Error {
  constructor(message:string){
    super(message)
    this.name = "PermissionError"
  }
}

export class UnexpectedError extends Error {
  constructor(message:string){
    super(message)
    this.name = "UnexpectedError"
  }
}

export class UnsupportedError extends Error {
  constructor(message:string){
    super(message)
    this.name = "UnsupportedError"
  }
}