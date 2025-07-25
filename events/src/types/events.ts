export interface DatabaseEvent {
  collection: string;
  action: "insert" | "update" | "delete"; // make symbol?
  eventData: {
    affected?: any[]; // The database records that were affected
    filter?: any; // For update/delete operations, what filter was used
    updateOperation?: any; // For update operations, what changes were made
    count?: number; // How many records were affected
    ids?: string[]; // IDs of affected records
  };
}
