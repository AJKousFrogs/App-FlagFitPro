import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { provideServerRendering } from "@angular/platform-server";
import { mergeApplicationConfig } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";

const serverConfig = {
  providers: [provideServerRendering()],
};

const config = mergeApplicationConfig(appConfig, serverConfig);

export default async function bootstrap(context: Record<string, unknown>) {
  return bootstrapApplication(AppComponent, { ...config, ...context });
}
