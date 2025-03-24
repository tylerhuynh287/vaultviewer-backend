export enum BinSuccessMessages {
  BIN_SUCCESS_UPDATE = "Success: Bin was updated",
  BIN_SUCCESS_DELETE = "Success: Bin and all items successfully deleted"
}

export enum BinErrorMessages {
  MISSING_BIN = "Error: Bin not found",
  MISSING_BIN_ID = "Error: Missing Bin ID",
  GENERIC_BIN_ERROR = "Error: Unable to Fetch Bins",
  UPDATE_BIN_ERROR  = "Error: Unable to update Bin",
  DELETE_BIN_ERROR = "Error: Unable to delete Bin"
}