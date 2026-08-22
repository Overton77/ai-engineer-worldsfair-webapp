// Fallback declarations for offline typechecking. The real package is required by test:e2e.
declare module "@playwright/test" {
  type Locator = { fill(value:string):Promise<void>; click():Promise<void> };
  type Page = { request: APIRequestContext; goto(url:string):Promise<unknown>; toString():string; getByLabel(value:RegExp):Locator; getByRole(role:string,options?:{name:string|RegExp}):Locator; getByText(value:string|RegExp):Locator };
  type APIRequestContext = { post(url:string,options?:{data:unknown}):Promise<{status():number;json():Promise<{result:{paperTrade:{simulationOnly:boolean}}}>}> };
  export const test: ((name:string,fn:(args:{page:Page;request:APIRequestContext})=>Promise<void>)=>void);
  export const expect: (value:unknown)=>{toBe(expected:unknown):void;toHaveURL(expected:RegExp):Promise<void>;toBeVisible():Promise<void>};
  export function defineConfig(value:unknown): unknown;
}
