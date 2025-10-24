import{r as y,_ as T,C as b,a as S,E as G,o as me,F as H,g as we,b as K,d as Ie,L as ye,i as Te,c as be,v as Ae,e as N,f as ve}from"./index-Boqs7vso.js";const W="@firebase/installations",D="0.6.19";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y=1e4,J=`w:${D}`,X="FIS_v2",Se="https://firebaseinstallations.googleapis.com/v1",ke=60*60*1e3,Ee="installations",Ce="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Re={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},h=new G(Ee,Ce,Re);function Q(e){return e instanceof H&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Z({projectId:e}){return`${Se}/projects/${e}/installations`}function ee(e){return{token:e.token,requestStatus:2,expiresIn:_e(e.expiresIn),creationTime:Date.now()}}async function te(e,t){const a=(await t.json()).error;return h.create("request-failed",{requestName:e,serverCode:a.code,serverMessage:a.message,serverStatus:a.status})}function ne({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function Pe(e,{refreshToken:t}){const n=ne(e);return n.append("Authorization",De(t)),n}async function ae(e){const t=await e();return t.status>=500&&t.status<600?e():t}function _e(e){return Number(e.replace("s","000"))}function De(e){return`${X} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Fe({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const a=Z(e),i=ne(e),r=t.getImmediate({optional:!0});if(r){const l=await r.getHeartbeatsHeader();l&&i.append("x-firebase-client",l)}const o={fid:n,authVersion:X,appId:e.appId,sdkVersion:J},s={method:"POST",headers:i,body:JSON.stringify(o)},c=await ae(()=>fetch(a,s));if(c.ok){const l=await c.json();return{fid:l.fid||n,registrationStatus:2,refreshToken:l.refreshToken,authToken:ee(l.authToken)}}else throw await te("Create Installation",c)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ie(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Me(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oe=/^[cdef][\w-]{21}$/,_="";function $e(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Ne(e);return Oe.test(n)?n:_}catch{return _}}function Ne(e){return Me(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function k(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const re=new Map;function se(e,t){const n=k(e);oe(n,t),xe(n,t)}function oe(e,t){const n=re.get(e);if(n)for(const a of n)a(t)}function xe(e,t){const n=Le();n&&n.postMessage({key:e,fid:t}),qe()}let g=null;function Le(){return!g&&"BroadcastChannel"in self&&(g=new BroadcastChannel("[Firebase] FID Change"),g.onmessage=e=>{oe(e.data.key,e.data.fid)}),g}function qe(){re.size===0&&g&&(g.close(),g=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const je="firebase-installations-database",Be=1,m="firebase-installations-store";let C=null;function F(){return C||(C=me(je,Be,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(m)}}})),C}async function A(e,t){const n=k(e),i=(await F()).transaction(m,"readwrite"),r=i.objectStore(m),o=await r.get(n);return await r.put(t,n),await i.done,(!o||o.fid!==t.fid)&&se(e,t.fid),t}async function ce(e){const t=k(e),a=(await F()).transaction(m,"readwrite");await a.objectStore(m).delete(t),await a.done}async function E(e,t){const n=k(e),i=(await F()).transaction(m,"readwrite"),r=i.objectStore(m),o=await r.get(n),s=t(o);return s===void 0?await r.delete(n):await r.put(s,n),await i.done,s&&(!o||o.fid!==s.fid)&&se(e,s.fid),s}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function M(e){let t;const n=await E(e.appConfig,a=>{const i=Ve(a),r=Ue(e,i);return t=r.registrationPromise,r.installationEntry});return n.fid===_?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Ve(e){const t=e||{fid:$e(),registrationStatus:0};return le(t)}function Ue(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(h.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},a=ze(e,n);return{installationEntry:n,registrationPromise:a}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Ge(e)}:{installationEntry:t}}async function ze(e,t){try{const n=await Fe(e,t);return A(e.appConfig,n)}catch(n){throw Q(n)&&n.customData.serverCode===409?await ce(e.appConfig):await A(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Ge(e){let t=await x(e.appConfig);for(;t.registrationStatus===1;)await ie(100),t=await x(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:a}=await M(e);return a||n}return t}function x(e){return E(e,t=>{if(!t)throw h.create("installation-not-found");return le(t)})}function le(e){return He(e)?{fid:e.fid,registrationStatus:0}:e}function He(e){return e.registrationStatus===1&&e.registrationTime+Y<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ke({appConfig:e,heartbeatServiceProvider:t},n){const a=We(e,n),i=Pe(e,n),r=t.getImmediate({optional:!0});if(r){const l=await r.getHeartbeatsHeader();l&&i.append("x-firebase-client",l)}const o={installation:{sdkVersion:J,appId:e.appId}},s={method:"POST",headers:i,body:JSON.stringify(o)},c=await ae(()=>fetch(a,s));if(c.ok){const l=await c.json();return ee(l)}else throw await te("Generate Auth Token",c)}function We(e,{fid:t}){return`${Z(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function O(e,t=!1){let n;const a=await E(e.appConfig,r=>{if(!ue(r))throw h.create("not-registered");const o=r.authToken;if(!t&&Xe(o))return r;if(o.requestStatus===1)return n=Ye(e,t),r;{if(!navigator.onLine)throw h.create("app-offline");const s=Ze(r);return n=Je(e,s),s}});return n?await n:a.authToken}async function Ye(e,t){let n=await L(e.appConfig);for(;n.authToken.requestStatus===1;)await ie(100),n=await L(e.appConfig);const a=n.authToken;return a.requestStatus===0?O(e,t):a}function L(e){return E(e,t=>{if(!ue(t))throw h.create("not-registered");const n=t.authToken;return et(n)?{...t,authToken:{requestStatus:0}}:t})}async function Je(e,t){try{const n=await Ke(e,t),a={...t,authToken:n};return await A(e.appConfig,a),n}catch(n){if(Q(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await ce(e.appConfig);else{const a={...t,authToken:{requestStatus:0}};await A(e.appConfig,a)}throw n}}function ue(e){return e!==void 0&&e.registrationStatus===2}function Xe(e){return e.requestStatus===2&&!Qe(e)}function Qe(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+ke}function Ze(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function et(e){return e.requestStatus===1&&e.requestTime+Y<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function tt(e){const t=e,{installationEntry:n,registrationPromise:a}=await M(t);return a?a.catch(console.error):O(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function nt(e,t=!1){const n=e;return await at(n),(await O(n,t)).token}async function at(e){const{registrationPromise:t}=await M(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function it(e){if(!e||!e.options)throw R("App Configuration");if(!e.name)throw R("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw R(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function R(e){return h.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const de="installations",rt="installations-internal",st=e=>{const t=e.getProvider("app").getImmediate(),n=it(t),a=S(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:a,_delete:()=>Promise.resolve()}},ot=e=>{const t=e.getProvider("app").getImmediate(),n=S(t,de).getImmediate();return{getId:()=>tt(n),getToken:i=>nt(n,i)}};function ct(){T(new b(de,st,"PUBLIC")),T(new b(rt,ot,"PRIVATE"))}ct();y(W,D);y(W,D,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const v="analytics",lt="firebase_id",ut="origin",dt=60*1e3,ft="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig",$="https://www.googletagmanager.com/gtag/js";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const u=new ye("@firebase/analytics");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pt={"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."},d=new G("analytics","Analytics",pt);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gt(e){if(!e.startsWith($)){const t=d.create("invalid-gtag-resource",{gtagURL:e});return u.warn(t.message),""}return e}function fe(e){return Promise.all(e.map(t=>t.catch(n=>n)))}function ht(e,t){let n;return window.trustedTypes&&(n=window.trustedTypes.createPolicy(e,t)),n}function mt(e,t){const n=ht("firebase-js-sdk-policy",{createScriptURL:gt}),a=document.createElement("script"),i=`${$}?l=${e}&id=${t}`;a.src=n?n?.createScriptURL(i):i,a.async=!0,document.head.appendChild(a)}function wt(e){let t=[];return Array.isArray(window[e])?t=window[e]:window[e]=t,t}async function It(e,t,n,a,i,r){const o=a[i];try{if(o)await t[o];else{const c=(await fe(n)).find(l=>l.measurementId===i);c&&await t[c.appId]}}catch(s){u.error(s)}e("config",i,r)}async function yt(e,t,n,a,i){try{let r=[];if(i&&i.send_to){let o=i.send_to;Array.isArray(o)||(o=[o]);const s=await fe(n);for(const c of o){const l=s.find(w=>w.measurementId===c),f=l&&t[l.appId];if(f)r.push(f);else{r=[];break}}}r.length===0&&(r=Object.values(t)),await Promise.all(r),e("event",a,i||{})}catch(r){u.error(r)}}function Tt(e,t,n,a){async function i(r,...o){try{if(r==="event"){const[s,c]=o;await yt(e,t,n,s,c)}else if(r==="config"){const[s,c]=o;await It(e,t,n,a,s,c)}else if(r==="consent"){const[s,c]=o;e("consent",s,c)}else if(r==="get"){const[s,c,l]=o;e("get",s,c,l)}else if(r==="set"){const[s]=o;e("set",s)}else e(r,...o)}catch(s){u.error(s)}}return i}function bt(e,t,n,a,i){let r=function(...o){window[a].push(arguments)};return window[i]&&typeof window[i]=="function"&&(r=window[i]),window[i]=Tt(r,e,t,n),{gtagCore:r,wrappedGtag:window[i]}}function At(e){const t=window.document.getElementsByTagName("script");for(const n of Object.values(t))if(n.src&&n.src.includes($)&&n.src.includes(e))return n;return null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vt=30,St=1e3;class kt{constructor(t={},n=St){this.throttleMetadata=t,this.intervalMillis=n}getThrottleMetadata(t){return this.throttleMetadata[t]}setThrottleMetadata(t,n){this.throttleMetadata[t]=n}deleteThrottleMetadata(t){delete this.throttleMetadata[t]}}const pe=new kt;function Et(e){return new Headers({Accept:"application/json","x-goog-api-key":e})}async function Ct(e){const{appId:t,apiKey:n}=e,a={method:"GET",headers:Et(n)},i=ft.replace("{app-id}",t),r=await fetch(i,a);if(r.status!==200&&r.status!==304){let o="";try{const s=await r.json();s.error?.message&&(o=s.error.message)}catch{}throw d.create("config-fetch-failed",{httpStatus:r.status,responseMessage:o})}return r.json()}async function Rt(e,t=pe,n){const{appId:a,apiKey:i,measurementId:r}=e.options;if(!a)throw d.create("no-app-id");if(!i){if(r)return{measurementId:r,appId:a};throw d.create("no-api-key")}const o=t.getThrottleMetadata(a)||{backoffCount:0,throttleEndTimeMillis:Date.now()},s=new Dt;return setTimeout(async()=>{s.abort()},dt),ge({appId:a,apiKey:i,measurementId:r},o,s,t)}async function ge(e,{throttleEndTimeMillis:t,backoffCount:n},a,i=pe){const{appId:r,measurementId:o}=e;try{await Pt(a,t)}catch(s){if(o)return u.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${o} provided in the "measurementId" field in the local Firebase config. [${s?.message}]`),{appId:r,measurementId:o};throw s}try{const s=await Ct(e);return i.deleteThrottleMetadata(r),s}catch(s){const c=s;if(!_t(c)){if(i.deleteThrottleMetadata(r),o)return u.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${o} provided in the "measurementId" field in the local Firebase config. [${c?.message}]`),{appId:r,measurementId:o};throw s}const l=Number(c?.customData?.httpStatus)===503?N(n,i.intervalMillis,vt):N(n,i.intervalMillis),f={throttleEndTimeMillis:Date.now()+l,backoffCount:n+1};return i.setThrottleMetadata(r,f),u.debug(`Calling attemptFetch again in ${l} millis`),ge(e,f,a,i)}}function Pt(e,t){return new Promise((n,a)=>{const i=Math.max(t-Date.now(),0),r=setTimeout(n,i);e.addEventListener(()=>{clearTimeout(r),a(d.create("fetch-throttle",{throttleEndTimeMillis:t}))})})}function _t(e){if(!(e instanceof H)||!e.customData)return!1;const t=Number(e.customData.httpStatus);return t===429||t===500||t===503||t===504}class Dt{constructor(){this.listeners=[]}addEventListener(t){this.listeners.push(t)}abort(){this.listeners.forEach(t=>t())}}async function Ft(e,t,n,a,i){if(i&&i.global){e("event",n,a);return}else{const r=await t,o={...a,send_to:r};e("event",n,o)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Mt(){if(be())try{await Ae()}catch(e){return u.warn(d.create("indexeddb-unavailable",{errorInfo:e?.toString()}).message),!1}else return u.warn(d.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;return!0}async function Ot(e,t,n,a,i,r,o){const s=Rt(e);s.then(p=>{n[p.measurementId]=p.appId,e.options.measurementId&&p.measurementId!==e.options.measurementId&&u.warn(`The measurement ID in the local Firebase config (${e.options.measurementId}) does not match the measurement ID fetched from the server (${p.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)}).catch(p=>u.error(p)),t.push(s);const c=Mt().then(p=>{if(p)return a.getId()}),[l,f]=await Promise.all([s,c]);At(r)||mt(r,l.measurementId),i("js",new Date);const w=o?.config??{};return w[ut]="firebase",w.update=!0,f!=null&&(w[lt]=f),i("config",l.measurementId,w),l.measurementId}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $t{constructor(t){this.app=t}_delete(){return delete I[this.app.options.appId],Promise.resolve()}}let I={},q=[];const j={};let P="dataLayer",Nt="gtag",B,he,V=!1;function xt(){const e=[];if(Te()&&e.push("This is a browser extension environment."),ve()||e.push("Cookies are not available."),e.length>0){const t=e.map((a,i)=>`(${i+1}) ${a}`).join(" "),n=d.create("invalid-analytics-context",{errorInfo:t});u.warn(n.message)}}function Lt(e,t,n){xt();const a=e.options.appId;if(!a)throw d.create("no-app-id");if(!e.options.apiKey)if(e.options.measurementId)u.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);else throw d.create("no-api-key");if(I[a]!=null)throw d.create("already-exists",{id:a});if(!V){wt(P);const{wrappedGtag:r,gtagCore:o}=bt(I,q,j,P,Nt);he=r,B=o,V=!0}return I[a]=Ot(e,q,j,t,B,P,n),new $t(e)}function Ut(e=we()){e=K(e);const t=S(e,v);return t.isInitialized()?t.getImmediate():qt(e)}function qt(e,t={}){const n=S(e,v);if(n.isInitialized()){const i=n.getImmediate();if(Ie(t,n.getOptions()))return i;throw d.create("already-initialized")}return n.initialize({options:t})}function jt(e,t,n,a){e=K(e),Ft(he,I[e.app.options.appId],t,n,a).catch(i=>u.error(i))}const U="@firebase/analytics",z="0.10.18";function Bt(){T(new b(v,(t,{options:n})=>{const a=t.getProvider("app").getImmediate(),i=t.getProvider("installations-internal").getImmediate();return Lt(a,i,n)},"PUBLIC")),T(new b("analytics-internal",e,"PRIVATE")),y(U,z),y(U,z,"esm2020");function e(t){try{const n=t.getProvider(v).getImmediate();return{logEvent:(a,i,r)=>jt(n,a,i,r)}}catch(n){throw d.create("interop-component-reg-failed",{reason:n})}}}Bt();export{Ut as getAnalytics,qt as initializeAnalytics,jt as logEvent};
