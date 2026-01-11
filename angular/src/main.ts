import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

// #region agent log
const _dbgLog=(l:string,m:string,d:object)=>{const e={location:l,message:m,data:d,timestamp:Date.now()};console.log('[DBG]',JSON.stringify(e));try{const logs=JSON.parse(sessionStorage.getItem('_dbg_logs')||'[]');logs.push(e);sessionStorage.setItem('_dbg_logs',JSON.stringify(logs.slice(-100)))}catch{}};
_dbgLog('main.ts:bootstrap','Angular app bootstrap starting',{timestamp:new Date().toISOString()});
// #endregion

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // #region agent log
    _dbgLog('main.ts:bootstrap-success','Angular app bootstrapped successfully',{timestamp:new Date().toISOString()});
    // #endregion
  })
  .catch((err) => {
    // #region agent log
    _dbgLog('main.ts:bootstrap-error','Angular app bootstrap failed',{errorMessage:err?.message,errorStack:err?.stack,errorType:err?.constructor?.name});
    // #endregion
    console.error(err);
  });
