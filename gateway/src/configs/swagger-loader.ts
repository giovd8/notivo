import { readFileSync } from "fs";
import jsyaml from "js-yaml";
import { join } from "path";

/**
 * Loads the Swagger document from various possible locations
 * @returns The parsed Swagger document
 * @throws Error if document cannot be found in any location
 */
export const loadSwaggerDocument = (): any => {
  const possiblePaths = [
    join(__dirname, "../../../swagger.yaml"), // Development (from dist folder)
    join(process.cwd(), "swagger.yaml"), // Docker volume mount
    "/app/swagger.yaml", // Docker absolute path
    join(__dirname, "../../swagger.yaml"), // Fallback development
  ];
  
  for (const path of possiblePaths) {
    try {
      const swaggerFile = readFileSync(path, "utf8");
      return jsyaml.load(swaggerFile) as any;
    } catch (error) {
      // Continue to next path
    }
  }
  
  throw new Error("Swagger document not found in any expected location");
};
