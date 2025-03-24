export enum ItemSuccessMessages {
    ITEM_SUCCESS_CREATE = "Success: Item was added to bin",
    ITEM_SUCCESS_UPDATE = "Success: Item was updated",
    ITEM_SUCCESS_DELETE = "Success: Item was deleted"
}

export enum ItemErrorMessages {
    MISSING_ITEM = "Error: Item was not found",
    MISSING_ITEM_ID = "Error: Missing Item ID",
    MISSING_BIN_ID = "Error: Missing Bin ID",
    GENERIC_ITEM_ERROR = "Error: Unable to Fetch Items",
    UPDATE_ITEM_ERROR = "Error: Unable to update Item",
    DELETE_ITEM_ERROR = "Error: Unable to delete Item",
    CREATE_ITEM_ERROR = "Error: Unable to create Item"
}