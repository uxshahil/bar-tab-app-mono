// Interface for creating a new drink with all required fields
export interface CreateNewDrink {
  id: number                    // Unique identifier for the drink
  name: string                  // Name of the drink
  slug: string                  // URL-friendly version of drink name
  category: string             // Category the drink belongs to
  alcoholic: boolean | null    // Whether drink contains alcohol
  glass: string | null         // Type of glass used
  instructions: string | null  // Instructions for making the drink
  thumb_url: string           // URL for drink thumbnail image
  measurements: string[] | null // List of ingredient measurements
  ingredients: string[] | null // List of ingredients
  active: boolean             // Whether drink is active/available
  price: number | null        // Price of the drink
  last_modified: Date | null  // Last modification timestamp
}

// Interface for editing an existing drink
export interface EditDrink {
  id: number,                  // ID of drink to edit
  data: Partial<CreateNewDrink> // Partial data to update
}

// Interface for deleting a drink
export interface DeleteDrink {
  id: number                   // ID of drink to delete
}
