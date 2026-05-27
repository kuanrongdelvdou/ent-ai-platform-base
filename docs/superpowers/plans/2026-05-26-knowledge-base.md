# 鐭ヨ瘑搴擄紙RAGFlow 闆嗘垚锛夊疄鐜拌鍒?
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 鍒嗛樁娈靛疄鐜?RAGFlow 灏藉彲鑳藉畬鏁寸殑浼佷笟闆嗘垚鍚庡彴锛歅hase 1 鐭ヨ瘑搴?CRUD + 鏂囨。绠＄悊 + 璇箟妫€绱?+ 鏉冮檺闅旂锛汸hase 2 瀵硅瘽鍔╂墜 + 浼氳瘽绠＄悊 + 娴佸紡瀵硅瘽 + 璺ㄥ簱妫€绱?+ 鏂囦欢涓嬭浇/棰勮锛汸hase 3 鍒囩墖绠＄悊 + 鏅鸿兘浣撶鐞?+ LLM 閰嶇疆锛汸hase 4 琛ラ綈 RAGFlow 楂橀樁鑳藉姏锛堟爣绛俱€佸厓鏁版嵁銆丟raphRAG/RAPTOR銆佺储寮曘€佽繛鎺ュ櫒銆丮emory銆丮CP銆佺粺璁°€佺郴缁?Token锛夈€?
**Architecture:** Frontend (Vue 3) 鈫?NestJS Controller (`/knowledge`, `/chat`) 鈫?Service 灞?鈫?Ragflow*Service (HTTP 灞? native fetch) 鈫?RAGFlow (`/api/v1` + `/v1` web API, localhost:9380)銆侾hase 2 灏?RagflowApiService 鎷嗗垎涓?ragflow/ 瀛愭ā鍧楋紙base + chat + file + search + chunk + agent + llm锛夈€係SE 娴佸紡瀵硅瘽閫氳繃 NestJS 杞彂浠ｇ悊銆侹nowledgeBase 琛ㄥ瓨鎴戜滑绯荤粺鐨勪笟鍔″厓鏁版嵁鍜?RBAC 鎺堟潈锛孯AGFlow 璐熻矗鏁版嵁闆嗐€佹枃妗ｈВ鏋愩€佸垏鐗囥€佸悜閲忔绱€丆hat/Agent/LLM 鑳藉姏銆?
**Tech Stack:** NestJS 11, Prisma 7, native fetch(), Vue 3 + Naive UI, class-validator

---

## 瀹炴柦鐘舵€侊紙2026-05-27锛?
### 鏈宸插畬鎴愶細Phase 1 涓婚摼璺?
- 宸插畬鎴?NestJS `KnowledgeModule`銆乣KnowledgeController`銆乣KnowledgeService`銆乣RagflowApiService`銆?- 宸插畬鎴?RAGFlow Dataset/Document/Search 鍩虹閫傞厤锛氬垱寤?鏇存柊/鍒犻櫎鐭ヨ瘑搴撱€佹枃妗ｅ垪琛ㄣ€佷笂浼犮€佸垹闄ゃ€佽В鏋愩€佸仠姝㈣В鏋愩€佽涔夋绱€?- 宸插畬鎴?Prisma `KnowledgeBaseRole` 瑙掕壊鎺堟潈妯″瀷锛屽苟琛ラ綈 `Role`銆乣KnowledgeBase` 鍙嶅悜 relation銆?- 宸插畬鎴愮煡璇嗗簱鑿滃崟銆佹寜閽潈闄愩€乣knowledge:search` 鏉冮檺鍜岃秴绾х鐞嗗憳鐭ヨ瘑搴撴巿鏉?seed 閫昏緫銆?- 宸插畬鎴愬墠绔煡璇嗗簱绠＄悊椤碉細鍒楄〃銆佺姸鎬佺瓫閫夈€佽鑹叉巿鏉冦€佹柊澧?缂栬緫銆佹枃妗ｇ鐞嗐€佷笂浼犮€佹壒閲忚В鏋?鍋滄/鍒犻櫎銆佽涔夋绱㈠脊绐椼€?- 宸插畬鎴愬墠绔?API 绫诲瀷銆丄PI 鍑芥暟銆佽矾鐢便€乺outeMap銆乮18n銆佽嚜鍔ㄧ粍浠剁被鍨嬭ˉ榻愩€?- 宸插畬鎴愭湰鍦板紑鍙戞湇鍔″惎鍔ㄩ獙璇侊細鍓嶇 `http://localhost:9527/`锛屽悗绔?Swagger `http://localhost:3000/api-docs`銆?
### 鏈鍒绘剰鏈仛

- 鏈墽琛屾暟鎹簱杩佺Щ/seed锛氳繖浼氭敼鏈湴鏁版嵁搴撴暟鎹紝闇€鍦ㄧ‘璁ょ洰鏍囨暟鎹簱鍚庢墜鍔ㄦ墽琛屻€?- 鏈彁浜ょ湡瀹?`.env`锛歊AGFlow API Key 灞炰簬鏁忔劅閰嶇疆锛屽彧鎻愪氦 `.env.example`锛涗唬鐮侀粯璁?`RAGFLOW_BASE_URL=http://localhost:9380`锛岄伩鍏嶆湭閰嶇疆鏃跺悗鍙版棤娉曞惎鍔ㄣ€?- 鏈媶 `views/knowledge/knowledge-base/composables/use-knowledge-table.ts`锛氬綋鍓?Phase 1 椤甸潰閫昏緫浠嶅湪鍙鑼冨洿鍐咃紝杩囨棭鎷嗗垎浼氬鍔犺烦杞垚鏈紱鍚庣画褰撳垪琛ㄩ〉鍙犲姞楂樼骇绛涢€夈€佹壒閲忔潈闄愩€佸鍏ヤ换鍔＄姸鎬佹椂鍐嶆媶銆?- 鏈疄鐜?Phase 2-4锛氬璇濆姪鎵嬨€丼SE銆佽法搴撴绱€佹枃浠堕瑙堛€佸垏鐗囩鐞嗐€丄gent銆丩LM 閰嶇疆銆丟raphRAG/RAPTOR銆佽繛鎺ュ櫒绛変粛鎸夊悗缁樁娈垫帹杩涖€?
### 宸查獙璇?
- `pnpm test -- knowledge`锛坆ackend锛夐€氳繃銆?- `pnpm build`锛坆ackend锛夐€氳繃銆?- `pnpm prisma validate`锛坆ackend锛夐€氳繃銆?- `pnpm typecheck`锛坒rontend锛夐€氳繃銆?- `pnpm build:test`锛坒rontend锛夐€氳繃銆?
---

## 瀹℃牳缁撹涓庝慨姝ｅ師鍒?
杩欎唤 spec 鐨勬柟鍚戞槸瀵圭殑锛歊AGFlow 搴斾綔涓虹煡璇嗗簱/RAG/Agent 寮曟搸锛屾垜浠殑骞冲彴鍋氱粺涓€闂ㄦ埛銆佹潈闄愩€佸璁″拰浜屾灏佽銆備絾鍘?spec 鏈夊嚑绫诲繀椤讳慨姝ｇ殑闂锛屽惁鍒欏悗闈細瀹炵幇鍒颁竴鍗婃墠鍙戠幇鎺ュ彛涓嶉€氭垨鏉冮檺妯″瀷涓嶆垚绔嬨€?
### 淇濈暀鈥滃敖鍙兘鍏ㄢ€濈殑鍘熷垯

- 涓嶇爫鎺?Agent銆丆hunk銆丩LM 閰嶇疆銆佹枃浠堕瑙堛€佽法搴撴绱㈢瓑鑳藉姏锛涜繖浜涢兘灞炰簬浼佷笟 AI 涓彴搴旇鐩栫殑 RAGFlow 鑳藉姏銆?- 涓嶆妸鎵€鏈夎兘鍔涢兘濉炶繘 Phase 1銆侾hase 1 蹇呴』鍏堟墦閫氣€滅煡璇嗗簱-鏂囨。-瑙ｆ瀽-妫€绱?鏉冮檺-瀹¤鈥濋棴鐜紱Phase 2 鍋氬璇濓紱Phase 3 鍋氬彲瑙嗗寲楂樼骇绠＄悊锛汸hase 4 鍐嶈ˉ RAGFlow 楂橀樁鐢熸€佽兘鍔涖€?- 鎴戜滑涓嶅鍒?RAGFlow 鐨勫簳灞傝兘鍔涖€傛枃妗ｈВ鏋愩€丱CR銆佸悜閲忓寲銆佸彫鍥炪€丄gent DSL銆丩LM provider 浠嶇敱 RAGFlow 鎵挎媴锛涙垜浠彧鍋氫紒涓氱郴缁熼渶瑕佺殑缁熶竴璐﹀彿銆佽彍鍗曟潈闄愩€佹暟鎹潈闄愩€佸璁℃棩蹇椼€佷綋楠屽皝瑁呫€?
### 蹇呴』淇鐨勪笉鍚堢悊鐐?
1. **涓嶈兘鎻愪氦 `ai-admin/backend/.env`銆?*
   鍘?spec 閲岃 `git add ai-admin/backend/.env`锛岃繖鏄敊璇殑銆俙.env` 閲屼細鏀?`RAGFLOW_API_KEY`锛屽繀椤诲彧鎻愪氦 `.env.example`锛岀湡瀹炲€兼湰鍦版垨鏈嶅姟鍣ㄩ厤缃€?
2. **RAGFlow API Key 蹇呴』鐢?`Authorization: Bearer <token>`銆?*
   鍘?spec 浠ｇ爜鍐?`Authorization = apiKey`锛屽拰 RAGFlow SDK/HTTP 鏂囨。涓嶄竴鑷淬€傛墍鏈?`/api/v1` REST API 閮芥寜 Bearer token 鍙戦€併€?
3. **Prisma 鏉冮檺妯″瀷缂哄皯鍙嶅悜 relation銆?*
   `KnowledgeBaseRole` 鍙啓鍏宠仈琛ㄤ笉澶燂紝`KnowledgeBase` 鍜?`Role` 涓婁篃瑕佸姞 `knowledgeBaseRoles KnowledgeBaseRole[]`锛屽惁鍒?Prisma schema 寰堝彲鑳芥棤娉曠敓鎴愩€?
4. **鏂囨。瑙ｆ瀽/鍋滄瑙ｆ瀽蹇呴』浼?`document_ids`銆?*
   RAGFlow 褰撳墠 `/api/v1/datasets/{dataset_id}/documents/parse` 鍜?`/stop` 閮借姹?body 閲屾湁 `document_ids: string[]`銆傚師 spec 閲屾棤鍙傝皟鐢?parse/stop 涓嶅悎鐞嗐€?
5. **Chat 娴佸紡鎺ュ彛璺緞鍜?payload 鍐欓敊銆?*
   RAGFlow 褰撳墠鎺ㄨ崘 `POST /api/v1/chat/completions`锛宐ody 閲屼紶 `chat_id`銆乣session_id`銆乣messages`銆乣stream`銆傚師 spec 鐢?`/chats/{chatId}/completions` + `question`锛岃繖鏄棫/SDK 鍏煎鎬濊矾锛屼笉鑳戒綔涓烘柊瀹炵幇濂戠害銆?
6. **Chunk API 鏄€滄枃妗ｇ骇鈥濓紝涓嶆槸鈥滅煡璇嗗簱绾р€濄€?*
   RAGFlow 瀹為檯璺緞鏄?`/api/v1/datasets/{dataset_id}/documents/{document_id}/chunks...`銆傚師 spec 鐨?`/datasets/{datasetId}/chunks`銆乣/chunks/search` 涓嶅瓨鍦ㄣ€傚垏鐗囩鐞嗛〉闈㈠繀椤诲厛閫夌煡璇嗗簱鍜屾枃妗ｏ紝鍐嶇鐞嗚鏂囨。鐨?chunks銆?
7. **Agent 鎵ц鎺ュ彛璺緞鍐欓敊锛孉gent 鍒涘缓鍙傛暟涔熻繃搴︾畝鍖栥€?*
   RAGFlow Agent 鎵ц鏄?`POST /api/v1/agents/chat/completions`锛宐ody 閲屼紶 `agent_id`銆乣session_id`銆乣query`銆乣stream`銆傚垱寤?Agent 閫氬父闇€瑕?`title` 鍜?`dsl`锛屼笉鏄彧鏈?`name`銆傜涓€鐗堝彲浠ュ垪琛?璇︽儏/妯℃澘/浼氳瘽/杩愯鍏ㄨ鐩栵紝DSL 鐢诲竷缂栬緫鍏堣烦杞?RAGFlow 鍘熺敓 UI 鎴栦繚瀛樺師濮?JSON銆?
8. **LLM 閰嶇疆涓嶅湪 `/api/v1/llm/*`銆?*
   RAGFlow LLM 閰嶇疆灞炰簬 web API锛岃矾寰勬槸 `/v1/llm/my_llms`銆乣/v1/llm/set_api_key`銆乣/v1/llm/add_llm` 绛夛紱绉熸埛榛樿妯″瀷鏄?`/api/v1/users/me/models`銆傝繖閮ㄥ垎瑕佸崟鐙敮鎸?`/v1` 鍓嶇紑鍜屾晱鎰熷瓧娈佃劚鏁忥紝涓嶈兘娣疯繘鏅€?`/api/v1` 瀹㈡埛绔€?
9. **鈥滃叏鍔熻兘鈥濋渶瑕佹柊澧?Phase 4銆?*
   RAGFlow 杩樻湁 tags銆乵etadata銆丟raphRAG/RAPTOR銆乮ndex銆乪mbedding check銆乮ngestion logs銆乧onnectors銆乵emory銆丮CP銆乻ystem tokens銆乻tats 绛夎兘鍔涖€傚師 spec 娌℃湁杩欎簺锛屽鏋滅洰鏍囨槸灏藉彲鑳藉叏锛屽繀椤绘樉寮忓垪鍏ュ悗缁樁娈点€?
### 缁熶竴璁捐鍐崇瓥

| 鍐崇瓥 | 缁撹 | 鑷В閲婄悊鐢?|
|------|------|------------|
| RAGFlow 鏄惁浣滀负鐙珛鏈嶅姟 | 鏄?| RAGFlow 浠ｇ爜浣撻噺澶с€佷緷璧栧鏉傘€佸崌绾ч绻侊紱宓屽叆婧愮爜浼氱牬鍧忔垜浠殑搴曞骇杈圭晫銆?|
| 鎴戜滑鏄惁淇濆瓨鏂囨。/鍒囩墖姝ｆ枃 | 鍚︼紝榛樿涓嶄繚瀛?| 姝ｆ枃銆佸垏鐗囥€佸悜閲忋€佽В鏋愮姸鎬佺敱 RAGFlow 绠★紱鎴戜滑鍙繚瀛樹笟鍔℃槧灏勫拰鏉冮檺锛岄伩鍏嶅弻鍐欎笉涓€鑷淬€?|
| 鎴戜滑鏄惁淇濆瓨 RAGFlow datasetId/chatId/agentId | 鏄?| 杩欐槸鎴戜滑骞冲彴瀵硅薄涓?RAGFlow 瀵硅薄鐨勭ǔ瀹氭槧灏勶紝涓嶄繚瀛樹細瀵艰嚧鏉冮檺銆佸璁°€佽彍鍗曟棤娉曢棴鐜€?|
| 鏉冮檺鐢ㄨ鑹茶繕鏄儴闂?| Phase 1 鐢ㄨ鑹诧紝Phase 4 鎵╁睍閮ㄩ棬/缁勭粐 | 褰撳墠鍚庡彴搴曞骇宸叉湁 Role/UserRole锛岃鑹插疄鐜版垚鏈渶浣庯紱閮ㄩ棬鏉冮檺鍚庣画鍙姞 KnowledgeBaseDept銆?|
| 鏄惁鍋?RAGFlow 鍘熺敓 UI 鐨勫叏閮ㄥ鍒?| 涓嶅鍒诲簳灞傜敾甯冿紝灏佽甯哥敤浼佷笟鎿嶄綔 | Agent DSL 鐢诲竷銆佸鏉?LLM provider 琛ㄥ崟澶嶅埢鎴愭湰楂樹笖鏄撻殢 RAGFlow 鍗囩骇鍙樺姩锛涗紒涓氶棬鎴峰厛灏佽鍒楄〃銆侀厤缃€佽繍琛屻€佽烦杞師鐢熼珮绾х紪杈戙€?|
| 鏄惁鏀寔澶氱敤鎴烽殧绂?| 鏀寔锛屼絾闅旂灞傚湪鎴戜滑骞冲彴 + RAGFlow token/tenant 鍙屽眰澶勭悊 | 鎴戜滑骞冲彴璐熻矗鑿滃崟/RBAC/涓氬姟鍙鎬э紱RAGFlow 璐熻矗 token 鎵€灞?tenant 鐨勫簳灞傚彲璁块棶鑼冨洿銆?|

## 鏂囦欢缁撴瀯

```
ai-admin/backend/src/
  knowledge/
    dto/knowledge.dto.ts          # 璇锋眰/鍝嶅簲 DTO (鎵€鏈?Phase)
    ragflow-api.service.ts        # Phase 1 RAGFlow HTTP 瀹㈡埛绔紙Phase 2 璧锋爣璁?@deprecated锛?    knowledge.service.ts          # 涓氬姟閫昏緫锛圥risma + RAGFlow 缂栨帓锛?    knowledge.controller.ts       # Phase 1 REST 绔偣锛圝WT 瀹堝崼锛?    knowledge.module.ts           # 妯″潡娉ㄥ唽
    chat.service.ts               # Phase 2: 瀵硅瘽鍔╂墜 + 浼氳瘽 + SSE 涓氬姟閫昏緫
    chat.controller.ts            # Phase 2: /chat REST 绔偣
    ragflow/
      ragflow-base.service.ts     # Phase 2: 鍏叡 HTTP 瀹㈡埛绔紙鍩虹被锛屾浛浠?ragflow-api锛?      ragflow-chat.service.ts     # Phase 2: Chat + Session API 灏佽
      ragflow-file.service.ts     # Phase 2: File 涓嬭浇/棰勮 API 灏佽
      ragflow-search.service.ts   # Phase 2: 璺ㄧ煡璇嗗簱妫€绱?API 灏佽
      ragflow-chunk.service.ts    # Phase 3: Chunk 鍒囩墖绠＄悊 API 灏佽
      ragflow-agent.service.ts    # Phase 3: Agent 鏅鸿兘浣?API 灏佽
      ragflow-llm.service.ts      # Phase 3: LLM 閰嶇疆 API 灏佽

ai-admin/backend/
  .env.example                    # 鏂板 RAGFLOW_BASE_URL, RAGFLOW_API_KEY 绀轰緥锛涚湡瀹?.env 涓嶆彁浜?  src/app.module.ts               # 鏂板 KnowledgeModule
  prisma/seed.ts                  # 鏂板鐭ヨ瘑搴撹彍鍗?+ 鎸夐挳鏉冮檺 + 瀵硅瘽鍔╂墜鑿滃崟

ai-admin/frontend/src/
  views/knowledge/knowledge-base/
    index.vue                     # 鐭ヨ瘑搴撳垪琛ㄩ〉
    modules/
      knowledge-operate-modal.vue # 鏂板/缂栬緫寮圭獥
      knowledge-search-modal.vue  # 璇箟妫€绱㈠脊绐?      knowledge-upload-modal.vue  # 涓婁紶鏂囨。寮圭獥
    composables/
      use-knowledge-table.ts      # 琛ㄦ牸鐘舵€侀€昏緫锛堟彁鍙栬嚜 index.vue锛?  views/knowledge/chat/           # Phase 2: 瀵硅瘽鍔╂墜椤甸潰
    index.vue                     # 瀵硅瘽鍔╂墜鍒楄〃椤?    modules/
      chat-operate-modal.vue      # 鍔╂墜鏂板/缂栬緫寮圭獥
      chat-conversation.vue       # SSE 娴佸紡瀵硅瘽鐣岄潰
  views/knowledge/chunk/          # Phase 3: 鍒囩墖绠＄悊椤甸潰
    index.vue
  views/knowledge/agent/          # Phase 3: 鏅鸿兘浣撶鐞嗛〉闈?    index.vue
  views/knowledge/llm-config/     # Phase 3: LLM 閰嶇疆椤甸潰
    index.vue
  service/api/knowledge.ts        # API 鍑芥暟锛堟墍鏈?Phase锛?  typings/api/knowledge.d.ts      # 绫诲瀷瀹氫箟锛堟墍鏈?Phase锛?  router/elegant/imports.ts       # 鏂板 view 瀵煎叆
  router/elegant/routes.ts        # 鏂板璺敱瀹氫箟
  router/elegant/transform.ts     # 鏂板 routeMap
  locales/settings/zh-CN.json     # 鏂板涓枃缈昏瘧
  locales/settings/en-US.json     # 鏂板鑻辨枃缈昏瘧
```

---

## Task 1: 鏁版嵁搴撹縼绉?+ 鐜鍙橀噺

**Files:**
- Modify: `ai-admin/backend/.env.example`
- Local-only: `ai-admin/backend/.env`
- Modify: `ai-admin/backend/prisma/schema.prisma`
- Run: `npx prisma db push`

- [ ] **Step 1: 娣诲姞 RAGFlow 鐜鍙橀噺**

鍦?`ai-admin/backend/.env.example` 鏈熬杩藉姞锛屽苟鍦ㄦ湰鍦?`ai-admin/backend/.env` 濉湡瀹炲€硷細

```bash
# RAGFlow
RAGFLOW_BASE_URL=http://localhost:9380
RAGFLOW_API_KEY=
```

`RAGFLOW_API_KEY` 鍦?`.env.example` 涓暀绌恒€傜湡瀹?token 鍙啓鍏ユ湰鍦版垨鏈嶅姟鍣?`.env`锛屼笉鑳芥彁浜ゃ€?鐢熸垚璺緞浼樺厛浣跨敤 RAGFlow `绯荤粺 Token/API Token` 椤甸潰锛涗篃鍙€氳繃 RAGFlow `POST /api/v1/system/tokens` 鐢熸垚銆?
- [ ] **Step 2: 娣诲姞 KnowledgeBaseRole 妯″瀷**

鍦?`schema.prisma` 涓ˉ榻愬弻鍚戝叧绯汇€俙Role` 鍜?`KnowledgeBase` 闇€瑕佸鍔?relation 鏁扮粍锛屽惁鍒?Prisma schema 鍏崇郴涓嶅畬鏁淬€?
```prisma
model Role {
  // ...existing fields
  knowledgeBaseRoles KnowledgeBaseRole[]
}

model KnowledgeBase {
  // ...existing fields
  knowledgeBaseRoles KnowledgeBaseRole[]
}

model KnowledgeBaseRole {
  kbId          String @map("kb_id")
  roleId        String @map("role_id")
  knowledgeBase KnowledgeBase @relation(fields: [kbId], references: [id], onDelete: Cascade)
  role          Role          @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([kbId, roleId])
  @@map("knowledge_base_roles")
}
```

杩欎釜妯″瀷瀹炵幇鐭ヨ瘑搴撲笌瑙掕壊鐨勫瀵瑰鍏宠仈锛岀敤浜庢暟鎹骇鏉冮檺闅旂锛?- 鍒涘缓鐭ヨ瘑搴撴椂鎸囧畾鍙闂殑瑙掕壊
- 鏌ヨ鏃跺彧杩斿洖鐢ㄦ埛鎵€灞炶鑹叉湁鏉冮檺鐨勭煡璇嗗簱
- 瀵瑰簲闇€姹傛枃妗?鐭ヨ瘑搴撲笌閮ㄩ棬/鏉冮檺缁戝畾"鍜?涓嶅悓瑙掕壊鐪嬪埌涓嶅悓鐭ヨ瘑搴?

- [ ] **Step 3: 鎵ц鏁版嵁搴撹縼绉?*

```bash
cd ai-admin/backend
npx prisma db push
```

棰勬湡锛歚knowledge_bases` 鍜?`knowledge_base_roles` 琛ㄥ垱寤烘垚鍔燂紝鎺у埗鍙版樉绀?`Your database is now in sync with your schema.`

- [ ] **Step 4: 鎻愪氦**

```bash
git add ai-admin/backend/.env.example ai-admin/backend/prisma/schema.prisma
git commit -m "feat: add KnowledgeBase, KnowledgeBaseRole models and RAGFlow env vars"
```

---

## Task 2: Knowledge DTOs

**Files:**
- Create: `ai-admin/backend/src/knowledge/dto/knowledge.dto.ts`

- [ ] **Step 1: 鍒涘缓 DTO 鏂囦欢**

```typescript
// ai-admin/backend/src/knowledge/dto/knowledge.dto.ts
import { IsString, IsOptional, IsInt, IsArray, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKnowledgeBaseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

export class UpdateKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  chunkMethod?: string;

  @IsOptional()
  @IsObject()
  parserConfig?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

export class KnowledgeBaseListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  current?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number = 10;

  @IsOptional()
  @IsString()
  name?: string;
}

export class DocumentListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_size?: number = 10;
}

export class ParseDocumentDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class DeleteDocumentDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class SearchDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  top_k?: number = 10;

  @IsOptional()
  @Type(() => Number)
  similarity_threshold?: number = 0.2;
}
```

- [ ] **Step 2: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃锛屾棤绫诲瀷閿欒

- [ ] **Step 3: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/
git commit -m "feat: add knowledge base DTOs"
```

---

## Task 3: RAGFlow API Service锛圚TTP 浠ｇ悊灞傦級

**Files:**
- Create: `ai-admin/backend/src/knowledge/ragflow-api.service.ts`

**娉ㄦ剰:** 鏈」鐩棤 axios锛屼娇鐢?Node.js 鍘熺敓 `fetch()`锛圢ode 18+锛夈€?
- [ ] **Step 1: 鍒涘缓 RagflowApiService**

```typescript
// ai-admin/backend/src/knowledge/ragflow-api.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/logger/app-logger.service';

interface RAGFlowResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

@Injectable()
export class RagflowApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly log = new AppLoggerService('RagflowApi');

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.getOrThrow<string>('RAGFLOW_BASE_URL');
    this.apiKey = this.config.get<string>('RAGFLOW_API_KEY', '');
  }

  private async request<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; params?: Record<string, string | number | boolean> } = {},
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { method = 'GET', body, params } = options;
    let url = `${this.baseUrl}/api/v1${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) searchParams.set(k, String(v));
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    this.log.debug(`RAGFlow ${method} ${url}`);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json: RAGFlowResponse<T> = await res.json();

      if (json.code === 0) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.message || `RAGFlow returned code ${json.code}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('RAGFlow request failed', msg);
      return { success: false, error: msg };
    }
  }

  // 鈹€鈹€鈹€ Dataset 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  async createDataset(data: { name: string; description?: string; chunk_method?: string; parser_config?: Record<string, unknown> }) {
    return this.request<{ dataset_id: string }>('/datasets', { method: 'POST', body: data });
  }

  async deleteDataset(datasetId: string) {
    return this.request('/datasets', { method: 'DELETE', body: { ids: [datasetId] } });
  }

  async updateDataset(datasetId: string, data: { name?: string; description?: string; chunk_method?: string; parser_config?: Record<string, unknown> }) {
    return this.request(`/datasets/${datasetId}`, { method: 'PUT', body: data });
  }

  async listDatasets(params: { page?: number; page_size?: number; orderby?: string; desc?: boolean; name?: string }) {
    return this.request<Array<{ id: string; name: string; description: string; status: string; chunk_num: number; doc_num: number; create_time: string }>>(
      '/datasets',
      { params: { page: params.page ?? 1, page_size: params.page_size ?? 30, orderby: params.orderby ?? 'create_time', desc: params.desc ?? true, ...(params.name ? { name: params.name } : {}) } },
    );
  }

  // 鈹€鈹€鈹€ Document 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  async uploadDocument(datasetId: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const url = `${this.baseUrl}/api/v1/datasets/${datasetId}/documents`;
    const formData = new FormData();
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

    const headers: Record<string, string> = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    this.log.debug(`RAGFlow POST /datasets/${datasetId}/documents (multipart)`);

    try {
      const res = await fetch(url, { method: 'POST', headers, body: formData });
      const json: RAGFlowResponse = await res.json();
      if (json.code === 0) return { success: true, data: json.data };
      return { success: false, error: json.message || `RAGFlow returned code ${json.code}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('RAGFlow upload document failed', msg);
      return { success: false, error: msg };
    }
  }

  async listDocuments(datasetId: string, params: { page?: number; page_size?: number }) {
    return this.request<Array<{
      id: string; name: string; status: string; size: number; create_time: string;
      chunk_method: string; parser_config: Record<string, unknown>; run: string; progress: number;
    }>>(`/datasets/${datasetId}/documents`, {
      params: { page: params.page ?? 1, page_size: params.page_size ?? 10 },
    });
  }

  async deleteDocuments(datasetId: string, ids: string[]) {
    return this.request(`/datasets/${datasetId}/documents`, { method: 'DELETE', body: { ids } });
  }

  async parseDocuments(datasetId: string, documentIds: string[]) {
    return this.request(`/datasets/${datasetId}/documents/parse`, {
      method: 'POST',
      body: { document_ids: documentIds },
    });
  }

  async stopParsing(datasetId: string, documentIds: string[]) {
    return this.request(`/datasets/${datasetId}/documents/stop`, {
      method: 'POST',
      body: { document_ids: documentIds },
    });
  }

  // 鈹€鈹€鈹€ Search 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  async search(datasetId: string, data: { question: string; top_k?: number; similarity_threshold?: number; vector_similarity_weight?: number; keyword?: boolean }) {
    return this.request<{ chunks: Array<{ content: string; document_name: string; similarity: number; positions: string[] }>; total: number }>(
      `/datasets/${datasetId}/search`,
      {
        method: 'POST',
        body: {
          question: data.question,
          top_k: data.top_k ?? 10,
          similarity_threshold: data.similarity_threshold ?? 0.2,
          vector_similarity_weight: data.vector_similarity_weight ?? 0.3,
          keyword: data.keyword ?? false,
        },
      },
    );
  }
}
```

- [ ] **Step 2: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 3: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/ragflow-api.service.ts
git commit -m "feat: add RAGFlow API service"
```

---

## Task 4: Knowledge Service锛堜笟鍔￠€昏緫灞傦級

**Files:**
- Create: `ai-admin/backend/src/knowledge/knowledge.service.ts`

- [ ] **Step 1: 鍒涘缓 KnowledgeService**

```typescript
// ai-admin/backend/src/knowledge/knowledge.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagflowApiService } from './ragflow-api.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge.dto';

@Injectable()
export class KnowledgeService {
  private readonly log = new AppLoggerService('KnowledgeService');

  constructor(
    private prisma: PrismaService,
    private ragflow: RagflowApiService,
  ) {}

  // 鈹€鈹€鈹€ 鐭ヨ瘑搴?CRUD 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  async getList(params: { current: number; size: number; name?: string; userId?: string }) {
    this.log.debug('getKnowledgeBaseList', params);
    const where: Record<string, unknown> = {};
    if (params.name) where.name = { contains: params.name };

    // 鏉冮檺闅旂锛氬彧杩斿洖鐢ㄦ埛鎵€灞炶鑹叉湁鏉冮檺鐨勭煡璇嗗簱
    if (params.userId) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: params.userId },
        select: { roleId: true },
      });
      const roleIds = userRoles.map((r) => r.roleId);
      if (roleIds.length > 0) {
        where.knowledgeBaseRoles = { some: { roleId: { in: roleIds } } };
      } else {
        // 鐢ㄦ埛鏃犱换浣曡鑹?-> 杩斿洖绌?        return { records: [], total: 0, current: params.current, size: params.size };
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.knowledgeBase.findMany({
        where,
        skip: (params.current - 1) * params.size,
        take: params.size,
        orderBy: { createdAt: 'desc' },
        include: { knowledgeBaseRoles: { select: { roleId: true } } },
      }),
      this.prisma.knowledgeBase.count({ where }),
    ]);

    return {
      records: list.map((kb) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        datasetId: kb.datasetId,
        chunkMethod: kb.chunkMethod,
        parserConfig: kb.parserConfig,
        status: kb.status,
        roleIds: kb.knowledgeBaseRoles.map((r) => r.roleId),
        createTime: kb.createdAt.toISOString(),
        updateTime: kb.updatedAt.toISOString(),
      })),
      total,
      current: params.current,
      size: params.size,
    };
  }

  async create(dto: CreateKnowledgeBaseDto) {
    this.log.info('createKnowledgeBase', { name: dto.name });

    // 1. 璋冪敤 RAGFlow 鍒涘缓 Dataset
    const { success, data, error } = await this.ragflow.createDataset({
      name: dto.name,
      description: dto.description,
      chunk_method: dto.chunkMethod,
      parser_config: dto.parserConfig,
    });

    if (!success || !data) {
      this.log.warn('RAGFlow createDataset failed', { error });
      throw new BadRequestException(`鍒涘缓 RAGFlow 鐭ヨ瘑搴撳け璐ワ細${error || '鏈煡閿欒'}`);
    }

    const datasetId = (data as Record<string, string>).dataset_id ?? (data as Record<string, string>).id;

    // 2. 鍐?KnowledgeBase 璁板綍 + 鏉冮檺鍏宠仈
    const kb = await this.prisma.knowledgeBase.create({
      data: {
        name: dto.name,
        description: dto.description,
        datasetId,
        chunkMethod: dto.chunkMethod,
        parserConfig: dto.parserConfig,
        status: 2,
        ...(dto.roleIds?.length
          ? { knowledgeBaseRoles: { create: dto.roleIds.map((roleId) => ({ roleId })) } }
          : {}),
      },
    });

    this.log.info('createKnowledgeBase success', { id: kb.id, datasetId });
    return null;
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    if (!kb) {
      this.log.warn('updateKnowledgeBase - not found', { id });
      throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
    }

    // 鏇存柊 RAGFlow
    if (kb.datasetId) {
      const { error } = await this.ragflow.updateDataset(kb.datasetId, {
        name: dto.name,
        description: dto.description,
        chunk_method: dto.chunkMethod,
        parser_config: dto.parserConfig,
      });
      if (error) {
        this.log.warn('RAGFlow updateDataset failed', { error });
        throw new BadRequestException(`鏇存柊 RAGFlow 鐭ヨ瘑搴撳け璐ワ細${error}`);
      }
    }

    await this.prisma.knowledgeBase.update({ where: { id }, data: dto });

    // 鏇存柊鏉冮檺鍏宠仈
    if (dto.roleIds !== undefined) {
      await this.prisma.knowledgeBaseRole.deleteMany({ where: { kbId: id } });
      if (dto.roleIds.length > 0) {
        await this.prisma.knowledgeBaseRole.createMany({
          data: dto.roleIds.map((roleId) => ({ kbId: id, roleId })),
        });
      }
    }

    this.log.info('updateKnowledgeBase success', { id });
    return null;
  }

  async remove(id: string) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    if (!kb) {
      this.log.warn('removeKnowledgeBase - not found', { id });
      throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
    }

    // 鍒犻櫎 RAGFlow Dataset
    if (kb.datasetId) {
      const { error } = await this.ragflow.deleteDataset(kb.datasetId);
      if (error) {
        this.log.warn('RAGFlow deleteDataset failed', { error });
      }
    }

    // KnowledgeBaseRole 鐢?onDelete: Cascade 鑷姩鍒犻櫎
    await this.prisma.knowledgeBase.delete({ where: { id } });
    this.log.info('removeKnowledgeBase success', { id });
    return null;
  }

  // 鈹€鈹€鈹€ 鏂囨。绠＄悊 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  async getDocumentList(kbId: string, params: { page: number; page_size: number }) {
    this.log.debug('getDocumentList', { kbId, ...params });
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');

    const { success, data, error } = await this.ragflow.listDocuments(kb.datasetId, params);
    if (!success) throw new BadRequestException(`鑾峰彇鏂囨。鍒楄〃澶辫触锛?{error}`);

    const docs = (data as Array<Record<string, unknown>>) ?? [];
    return {
      records: docs.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.run ?? d.status,
        size: d.size,
        chunkMethod: d.chunk_method,
        progress: d.progress,
        createTime: d.create_time,
      })),
      total: docs.length,
    };
  }

  async uploadDocument(kbId: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');

    this.log.info('uploadDocument', { kbId, filename: file.originalname });
    const { success, data, error } = await this.ragflow.uploadDocument(kb.datasetId, file);
    if (!success) throw new BadRequestException(`涓婁紶鏂囨。澶辫触锛?{error}`);

    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('uploadDocument success', { kbId, doc: data });
    return data;
  }

  async batchUploadDocuments(kbId: string, files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');

    this.log.info('batchUploadDocuments', { kbId, count: files.length });
    const results = [];
    for (const file of files) {
      const { success, data, error } = await this.ragflow.uploadDocument(kb.datasetId, file);
      if (!success) {
        this.log.warn('uploadDocument failed in batch', { filename: file.originalname, error });
      }
      results.push({ filename: file.originalname, success, data, error });
    }

    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('batchUploadDocuments success', { kbId, total: files.length, succeeded: results.filter((r) => r.success).length });
    return results;
  }

  async deleteDocument(kbId: string, docId: string) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');

    const { success, error } = await this.ragflow.deleteDocuments(kb.datasetId, [docId]);
    if (!success) throw new BadRequestException(`鍒犻櫎鏂囨。澶辫触锛?{error}`);

    this.log.info('deleteDocument success', { kbId, docId });
    return null;
  }

  async parseDocument(kbId: string, documentIds: string[]) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');

    const { success, error } = await this.ragflow.parseDocuments(kb.datasetId, documentIds);
    if (!success) throw new BadRequestException(`瑙ｆ瀽鏂囨。澶辫触锛?{error}`);

    this.log.info('parseDocument success', { kbId, documentIds });
    return null;
  }

  // 鈹€鈹€鈹€ 妫€绱?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  async search(kbId: string, dto: { question: string; keyword?: string; top_k: number; similarity_threshold: number }) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');

    this.log.debug('search', { kbId, question: dto.question.substring(0, 50) });

    const { success, data, error } = await this.ragflow.search(kb.datasetId, dto);
    if (!success) throw new BadRequestException(`妫€绱㈠け璐ワ細${error}`);

    return data;
  }
}
```

- [ ] **Step 2: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 3: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/knowledge.service.ts
git commit -m "feat: add knowledge service"
```

---

## Task 5: Knowledge Controller

**Files:**
- Create: `ai-admin/backend/src/knowledge/knowledge.controller.ts`

- [ ] **Step 1: 鍒涘缓 KnowledgeController**

```typescript
// ai-admin/backend/src/knowledge/knowledge.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OperationLog } from '../common/decorators/operation-log.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { KnowledgeService } from './knowledge.service';
import {
  CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto,
  KnowledgeBaseListDto, DocumentListDto, SearchDto,
} from './dto/knowledge.dto';

@ApiTags('鐭ヨ瘑搴?)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Get('getKnowledgeBaseList')
  getKnowledgeBaseList(@Query() dto: KnowledgeBaseListDto, @CurrentUser() user: { userId: string }) {
    return this.knowledgeService.getList({ ...dto, userId: user.userId });
  }

  @Permissions('knowledge:add')
  @OperationLog('鐭ヨ瘑搴?, '鏂板鐭ヨ瘑搴?)
  @Post('createKnowledgeBase')
  createKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.create(dto);
  }

  @Permissions('knowledge:edit')
  @OperationLog('鐭ヨ瘑搴?, '缂栬緫鐭ヨ瘑搴?)
  @Put('updateKnowledgeBase/:id')
  updateKnowledgeBase(@Param('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.knowledgeService.update(id, dto);
  }

  @Permissions('knowledge:delete')
  @OperationLog('鐭ヨ瘑搴?, '鍒犻櫎鐭ヨ瘑搴?)
  @Delete('deleteKnowledgeBase/:id')
  deleteKnowledgeBase(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }

  // 鈹€鈹€鈹€ 鏂囨。绠＄悊 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  @Get('getDocumentList/:kbId')
  getDocumentList(@Param('kbId') kbId: string, @Query() dto: DocumentListDto) {
    return this.knowledgeService.getDocumentList(kbId, dto);
  }

  @Permissions('knowledge:add')
  @OperationLog('鐭ヨ瘑搴?, '涓婁紶鏂囨。')
  @Post('uploadDocument/:kbId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@Param('kbId') kbId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('缂哄皯鏂囦欢');
    return this.knowledgeService.uploadDocument(kbId, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
  }

  @Permissions('knowledge:add')
  @OperationLog('鐭ヨ瘑搴?, '鎵归噺涓婁紶鏂囨。')
  @Post('uploadDocuments/:kbId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  uploadDocuments(@Param('kbId') kbId: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new Error('缂哄皯鏂囦欢');
    return this.knowledgeService.batchUploadDocuments(
      kbId,
      files.map((f) => ({ buffer: f.buffer, originalname: f.originalname, mimetype: f.mimetype })),
    );
  }

  @Delete('deleteDocument/:kbId/:docId')
  deleteDocument(@Param('kbId') kbId: string, @Param('docId') docId: string) {
    return this.knowledgeService.deleteDocument(kbId, docId);
  }

  @Post('parseDocument/:kbId')
  parseDocument(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto) {
    return this.knowledgeService.parseDocument(kbId, dto.ids);
  }

  // 鈹€鈹€鈹€ 妫€绱?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  @Permissions('knowledge:search')
  @Post('search/:kbId')
  search(@Param('kbId') kbId: string, @Body() dto: SearchDto) {
    return this.knowledgeService.search(kbId, dto);
  }
}
```

- [ ] **Step 2: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 3: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/knowledge.controller.ts
git commit -m "feat: add knowledge controller"
```

---

## Task 6: Knowledge Module + App 娉ㄥ唽

**Files:**
- Create: `ai-admin/backend/src/knowledge/knowledge.module.ts`
- Modify: `ai-admin/backend/src/app.module.ts:8-9,14-19`

- [ ] **Step 1: 鍒涘缓 KnowledgeModule**

```typescript
// ai-admin/backend/src/knowledge/knowledge.module.ts
import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { RagflowApiService } from './ragflow-api.service';

@Module({
  providers: [KnowledgeService, RagflowApiService],
  controllers: [KnowledgeController],
})
export class KnowledgeModule {}
```

- [ ] **Step 2: 鍦?app.module.ts 娉ㄥ唽 KnowledgeModule**

鍦?`app.module.ts` 鐨?imports 鏁扮粍涓紝`SystemManageModule` 涔嬪悗娣诲姞锛?
```typescript
import { KnowledgeModule } from './knowledge/knowledge.module';

// 鍦?imports 鏁扮粍涓細
KnowledgeModule,
```

- [ ] **Step 3: 楠岃瘉缂栬瘧 + 鍚姩**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃锛屽簲鐢ㄥ彲鍚姩

- [ ] **Step 4: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/knowledge.module.ts ai-admin/backend/src/app.module.ts
git commit -m "feat: register knowledge module"
```

---

## Task 7: 绉嶅瓙鏁版嵁 鈥?鐭ヨ瘑搴撹彍鍗?+ 鎸夐挳鏉冮檺 + 鏉冮檺鍏宠仈

**Files:**
- Modify: `ai-admin/backend/prisma/seed.ts:70`锛堝湪绯荤粺宸ュ叿鐩綍鍚庢坊鍔犵煡璇嗗簱鐩綍锛?
- [ ] **Step 1: 鍦?seed.ts 涓坊鍔犵煡璇嗗簱鑿滃崟**

鍦?`seed.ts` 涓紝`toolMenu` 鍒涘缓涔嬪悗銆乥uttonGroups 瀹氫箟涔嬪墠锛屾坊鍔犱互涓嬩唬鐮侊細

```typescript
  // 鐭ヨ瘑搴撶洰褰?  const knowledgeMenu = await prisma.menu.create({
    data: {
      parentId: null, type: 1, name: 'knowledge',
      path: '/knowledge', component: 'layout.base',
      icon: 'carbon:bookmark', sort: 40, status: 1,
    },
  });

  // 鐭ヨ瘑搴撶鐞嗛〉闈?  await prisma.menu.create({
    data: {
      parentId: knowledgeMenu.id, type: 2, name: 'knowledge_knowledge-base',
      path: '/knowledge/knowledge-base', component: 'layout.base$view.knowledge_knowledge-base',
      icon: 'carbon:folder', sort: 1, status: 1,
    },
  });
```

鐒跺悗鍦?`buttonGroups` 鏁扮粍涓坊鍔狅細

```typescript
    { page: 'knowledge_knowledge-base', prefix: 'knowledge', label: '鐭ヨ瘑搴? },
```

- [ ] **Step 2: 鎵嬪姩娣诲姞 search 鎸夐挳鏉冮檺**

`knowledge:search` 涓嶅湪鏍囧噯 CRUD锛坅dd/edit/delete锛変腑锛岄渶鍦ㄦ寜閽嚜鍔ㄥ垱寤洪€昏緫涔嬪悗鎵嬪姩娣诲姞锛?
```typescript
  // 鐭ヨ瘑搴撴绱㈡寜閽?  const kbPage = await prisma.menu.findUnique({ where: { name: 'knowledge_knowledge-base' } });
  if (kbPage) {
    await prisma.menu.create({
      data: {
        parentId: kbPage.id, type: 3, name: 'knowledge_knowledge-base:search',
        path: '', component: '', icon: '', sort: 4, status: 1,
      },
    });
  }
```

- [ ] **Step 3: 涓?admin 瑙掕壊鍏宠仈鎵€鏈夌煡璇嗗簱锛堝厤闄ゆ潈闄愰殧绂伙級**

鍦ㄨ彍鍗曞垱寤轰箣鍚庛€乻eed 缁撴潫涔嬪墠锛屼负 admin 瑙掕壊鍒涘缓 KnowledgeBaseRole锛?
```typescript
  // 涓虹鐞嗗憳璧嬩簣鎵€鏈夌煡璇嗗簱鐨勮闂潈闄?  const allKbs = await prisma.knowledgeBase.findMany({ select: { id: true } });
  const adminRole = await prisma.role.findUnique({ where: { code: 'admin' } });
  if (adminRole && allKbs.length > 0) {
    await prisma.knowledgeBaseRole.createMany({
      data: allKbs.map((kb) => ({ kbId: kb.id, roleId: adminRole.id })),
      skipDuplicates: true,
    });
  }
```

- [ ] **Step 4: 楠岃瘉绉嶅瓙鏁版嵁鎻掑叆**

```bash
cd ai-admin/backend
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

棰勬湡锛?```
鉁?绠＄悊鍛樿处鍙? soybean
鉁?鑿滃崟宸查噸寤猴紝鍏?XX 鏉?鉁?Seed 瀹屾垚
```

姣斾箣鍓嶅 5 鏉★紙1 鐩綍 + 1 椤甸潰 + 4 鎸夐挳鏉冮檺 = 澶?6 鏉★級

- [ ] **Step 5: 楠岃瘉璺敱鎺ュ彛**

```bash
# 鐧诲綍鑾峰彇 token
TOKEN=$(curl -s "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userName":"soybean","password":"soybean123"}' | \
  jq -r '.data.token')

# 鑾峰彇璺敱鍒楄〃
curl -s "http://localhost:3000/route/getUserRoutes" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.routes[] | select(.name | startswith("knowledge"))'
```

棰勬湡锛氳繑鍥?knowledge 鐩綍鍜?knowledge_knowledge-base 椤甸潰璺敱

- [ ] **Step 4: 鎻愪氦**

```bash
git add ai-admin/backend/prisma/seed.ts
git commit -m "feat: add knowledge base menu and button permissions to seed"
```

---

## Task 8: 鍓嶇绫诲瀷瀹氫箟

**Files:**
- Create: `ai-admin/frontend/src/typings/api/knowledge.d.ts`

- [ ] **Step 1: 鍒涘缓绫诲瀷鏂囦欢**

```typescript
// ai-admin/frontend/src/typings/api/knowledge.d.ts
declare namespace Api {
  namespace Knowledge {
    type KnowledgeBase = {
      id: string;
      name: string;
      description: string | null;
      datasetId: string | null;
      chunkMethod: string | null;
      parserConfig: Record<string, unknown> | null;
      status: number;
      roleIds: string[];
      createTime: string;
      updateTime: string;
    };

    type KnowledgeBaseSearchParams = CommonType.RecordNullable<
      { name?: string } & { current: number; size: number }
    >;

    type KnowledgeBaseList = Common.PaginatingQueryRecord<KnowledgeBase>;

    type DocumentItem = {
      id: string;
      name: string;
      status: string;
      size: number;
      chunkMethod: string;
      progress: number;
      createTime: string;
    };

    type DocumentSearchParams = { page: number; page_size: number };

    type SearchParams = {
      question: string;
      keyword?: string;
      top_k?: number;
      similarity_threshold?: number;
    };

    type SearchResult = {
      chunks: Array<{
        content: string;
        document_name: string;
        similarity: number;
        positions: string[];
      }>;
      total: number;
    };
  }
}
```

- [ ] **Step 2: 楠岃瘉 TypeScript 缂栬瘧**

```bash
cd ai-admin/frontend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃锛屾棤绫诲瀷閿欒

- [ ] **Step 3: 鎻愪氦**

```bash
git add ai-admin/frontend/src/typings/api/knowledge.d.ts
git commit -m "feat: add knowledge base frontend types"
```

---

## Task 9: 鍓嶇 API 鍑芥暟

**Files:**
- Create: `ai-admin/frontend/src/service/api/knowledge.ts`

- [ ] **Step 1: 鍒涘缓 API 鍑芥暟鏂囦欢**

```typescript
// ai-admin/frontend/src/service/api/knowledge.ts
import { request } from '../request';

export function fetchGetKnowledgeBaseList(params?: Api.Knowledge.KnowledgeBaseSearchParams) {
  return request<Api.Knowledge.KnowledgeBaseList>({
    url: '/knowledge/getKnowledgeBaseList', method: 'get', params,
  });
}

export function fetchCreateKnowledgeBase(data: { name: string; description?: string; chunkMethod?: string; parserConfig?: Record<string, unknown> }) {
  return request<null>({ url: '/knowledge/createKnowledgeBase', method: 'post', data });
}

export function fetchUpdateKnowledgeBase(id: string, data: { name?: string; description?: string; chunkMethod?: string; parserConfig?: Record<string, unknown> }) {
  return request<null>({ url: `/knowledge/updateKnowledgeBase/${id}`, method: 'put', data });
}

export function fetchDeleteKnowledgeBase(id: string) {
  return request<null>({ url: `/knowledge/deleteKnowledgeBase/${id}`, method: 'delete' });
}

export function fetchGetDocumentList(kbId: string, params?: Api.Knowledge.DocumentSearchParams) {
  return request<{ records: Api.Knowledge.DocumentItem[]; total: number }>({
    url: `/knowledge/getDocumentList/${kbId}`, method: 'get', params,
  });
}

export function fetchUploadDocument(kbId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<null>({
    url: `/knowledge/uploadDocument/${kbId}`, method: 'post', data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function fetchUploadDocuments(kbId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  return request<Array<{ filename: string; success: boolean; error?: string }>>({
    url: `/knowledge/uploadDocuments/${kbId}`, method: 'post', data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function fetchDeleteDocument(kbId: string, docId: string) {
  return request<null>({ url: `/knowledge/deleteDocument/${kbId}/${docId}`, method: 'delete' });
}

export function fetchParseDocument(kbId: string) {
  return request<null>({ url: `/knowledge/parseDocument/${kbId}`, method: 'post' });
}

export function fetchSearchKnowledge(kbId: string, data: Api.Knowledge.SearchParams) {
  return request<Api.Knowledge.SearchResult>({ url: `/knowledge/search/${kbId}`, method: 'post', data });
}
```

- [ ] **Step 2: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/frontend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 3: 鎻愪氦**

```bash
git add ai-admin/frontend/src/service/api/knowledge.ts
git commit -m "feat: add knowledge base API functions"
```

---

## Task 10: 鍓嶇鐭ヨ瘑搴撳垪琛ㄩ〉锛堥噸鏋勭増锛? 妫€绱?+ 鎵归噺涓婁紶

**Files:**
- Create: `ai-admin/frontend/src/views/knowledge/knowledge-base/composables/use-knowledge-table.ts`
- Create: `ai-admin/frontend/src/views/knowledge/knowledge-base/modules/knowledge-search-modal.vue`
- Create: `ai-admin/frontend/src/views/knowledge/knowledge-base/modules/knowledge-upload-modal.vue`
- Create: `ai-admin/frontend/src/views/knowledge/knowledge-base/index.vue`
- Create: `ai-admin/frontend/src/views/knowledge/knowledge-base/modules/knowledge-operate-modal.vue`

- [ ] **Step 1: 鍒涘缓琛ㄦ牸鐘舵€?Composable锛堟彁鍙栬嚜 index.vue锛孎ix 5锛?*

灏嗚〃鏍肩姸鎬佺鐞嗘彁鍙栧埌鍗曠嫭鏂囦欢锛屼娇 index.vue 涓嶈秴杩?50 琛屼笟鍔￠€昏緫锛?
```typescript
// ai-admin/frontend/src/views/knowledge/knowledge-base/composables/use-knowledge-table.ts
import { ref, computed } from 'vue';
import { fetchGetKnowledgeBaseList, fetchDeleteKnowledgeBase } from '@/service/api/knowledge';

export function useKnowledgeTable() {
  const loading = ref(false);
  const data = ref<Api.Knowledge.KnowledgeBase[]>([]);
  const searchName = ref('');
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  async function getData() {
    loading.value = true;
    try {
      const { error, data: result } = await fetchGetKnowledgeBaseList({
        current: page.value,
        size: pageSize.value,
        name: searchName.value || undefined,
      });
      if (!error && result) {
        data.value = result.records;
        total.value = result.total;
      }
    } finally {
      loading.value = false;
    }
  }

  async function handleDelete(id: string) {
    const { error } = await fetchDeleteKnowledgeBase(id);
    if (!error) getData();
  }

  const pagination = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    itemCount: total.value,
    showSizePicker: true,
    pageSizes: [10, 20, 30],
    onChange: (p: number) => { page.value = p; getData(); },
    onUpdatePageSize: (s: number) => { pageSize.value = s; getData(); },
  }));

  return { loading, data, searchName, page, pageSize, total, getData, handleDelete, pagination };
}
```

- [ ] **Step 2: 鍒涘缓妫€绱㈠脊绐楃粍浠讹紙Fix 3 鈥?楂樹寒鍛戒腑娈佃惤锛?*

```vue
<!-- ai-admin/frontend/src/views/knowledge/knowledge-base/modules/knowledge-search-modal.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NInput, NButton, NSpace, NTag, NSpin, NScrollbar } from 'naive-ui';
import { fetchSearchKnowledge } from '@/service/api/knowledge';

interface Props {
  visible: boolean;
  kbId: string;
  kbName: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>();

const question = ref('');
const results = ref<Api.Knowledge.SearchResult | null>(null);
const searching = ref(false);
const searched = ref(false);

async function handleSearch() {
  if (!question.value.trim()) return;
  searching.value = true;
  searched.value = true;
  try {
    const { error, data } = await fetchSearchKnowledge(props.kbId, { question: question.value, top_k: 10, similarity_threshold: 0.2 });
    if (!error && data) results.value = data;
  } finally {
    searching.value = false;
  }
}

function highlightText(text: string, keyword: string): string {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:#f0e68c;padding:0 2px">$1</mark>');
}

function handleClose() { emit('update:visible', false); results.value = null; searched.value = false; }
</script>
<template>
  <NModal :show="visible" title="鐭ヨ瘑搴撴绱? style="width: 800px" @update:show="emit('update:visible', $event)" @after-leave="handleClose">
    <div class="p-4">
      <div class="mb-4 text-sm text-gray-500">褰撳墠鐭ヨ瘑搴擄細{{ kbName }}</div>
      <NSpace class="mb-4">
        <NInput v-model:value="question" placeholder="杈撳叆妫€绱㈤棶棰? clearable style="width: 500px" @keyup.enter="handleSearch" />
        <NButton type="primary" :loading="searching" @click="handleSearch">妫€绱?/NButton>
      </NSpace>
      <NScrollbar style="max-height: 500px">
        <NSpin :show="searching">
          <div v-if="searched && !searching">
            <div v-if="results?.chunks?.length" class="space-y-3">
              <div v-for="(chunk, idx) in results.chunks" :key="idx" class="border rounded-lg p-3">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm font-medium">{{ chunk.document_name }}</span>
                  <NTag size="small" :type="chunk.similarity > 0.5 ? 'success' : 'info'">
                    {{ (chunk.similarity * 100).toFixed(1) }}%
                  </NTag>
                </div>
                <div class="text-sm leading-relaxed" v-html="highlightText(chunk.content, question)"></div>
              </div>
            </div>
            <div v-else class="text-center text-gray-400 py-8">鏈壘鍒板尮閰嶇粨鏋?/div>
          </div>
        </NSpin>
      </NScrollbar>
    </div>
  </NModal>
</template>
```

- [ ] **Step 3: 鍒涘缓鎵归噺涓婁紶寮圭獥缁勪欢锛團ix 2锛?*

```vue
<!-- ai-admin/frontend/src/views/knowledge/knowledge-base/modules/knowledge-upload-modal.vue -->
<script setup lang="ts">
import { ref, h } from 'vue';
import { NModal, NButton, NSpace, NUpload, NUploadDragger, NIcon, NDataTable, NTag } from 'naive-ui';
import { fetchUploadDocuments } from '@/service/api/knowledge';

interface Props { visible: boolean; kbId: string; kbName: string; }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'uploaded'): void }>();

const uploadedFiles = ref<File[]>([]);
const uploading = ref(false);
const uploadResults = ref<Array<{ filename: string; success: boolean; error?: string }> | null>(null);

function handleChange({ file }: { file: File }) { uploadedFiles.value.push(file); }
async function handleUpload() {
  if (!uploadedFiles.value.length) return;
  uploading.value = true;
  try {
    const { error, data } = await fetchUploadDocuments(props.kbId, uploadedFiles.value);
    if (data) { uploadResults.value = data; if (data.every((r) => r.success)) emit('uploaded'); }
  } finally { uploading.value = false; }
}
</script>
<template>
  <NModal :show="visible" title="涓婁紶鏂囨。" style="width: 700px" @update:show="emit('update:visible', $event)">
    <div class="p-4">
      <div class="mb-4 text-sm text-gray-500">鐭ヨ瘑搴擄細{{ kbName }}</div>
      <NUpload :multiple="true" :show-file-list="false" @change="handleChange">
        <NUploadDragger>
          <NIcon size="48"><icon-ic-round-cloud-upload /></NIcon>
          <p>鐐瑰嚮鎴栨嫋鎷芥枃浠跺埌姝ゅ涓婁紶</p>
          <p class="text-xs text-gray-400">鏀寔 PDF銆乄ord銆丒xcel銆丳PT銆乀XT銆佸浘鐗囩瓑鏍煎紡</p>
        </NUploadDragger>
      </NUpload>
      <div v-if="uploadedFiles.length" class="mt-4">
        <p class="text-sm font-medium mb-2">宸查€夋嫨 {{ uploadedFiles.length }} 涓枃浠?/p>
        <NButton size="tiny" @click="uploadedFiles = []">娓呯┖</NButton>
      </div>
      <div v-if="uploadResults" class="mt-4">
        <p class="text-sm font-medium mb-2">涓婁紶缁撴灉</p>
        <NDataTable :data="uploadResults" :columns="[
          { key: 'filename', title: '鏂囦欢鍚? },
          { key: 'success', title: '鐘舵€?, render: (row: any) => row.success ? h(NTag, { type: 'success' }, () => '鎴愬姛') : h(NTag, { type: 'error' }, () => '澶辫触') },
          { key: 'error', title: '閿欒淇℃伅' },
        ]" size="small" :bordered="false" />
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="emit('update:visible', false)">鍏抽棴</NButton>
          <NButton type="primary" :loading="uploading" :disabled="!uploadedFiles.length" @click="handleUpload">涓婁紶 ({{ uploadedFiles.length }})</NButton>
        </NSpace>
      </template>
    </div>
  </NModal>
</template>
```

- [ ] **Step 4: 鏇存柊鏂板/缂栬緫寮圭獥锛堟坊鍔犺鑹查€夋嫨锛孎ix 1锛?*

鏀归€?`knowledge-operate-modal.vue`锛屾坊鍔犺鑹插閫夊拰 form.roleIds锛?
```vue
<!-- ai-admin/frontend/src/views/knowledge/knowledge-base/modules/knowledge-operate-modal.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NSpace } from 'naive-ui';
import { fetchCreateKnowledgeBase, fetchUpdateKnowledgeBase } from '@/service/api/knowledge';
import { fetchGetAllRoles } from '@/service/api/system-manage';

interface Props { visible: boolean; operateType: 'add' | 'edit'; rowData?: Api.Knowledge.KnowledgeBase | null; }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'submitted'): void }>();
const title = computed(() => props.operateType === 'add' ? '鏂板鐭ヨ瘑搴? : '缂栬緫鐭ヨ瘑搴?);

const form = ref({ name: '', description: '', chunkMethod: 'naive' as string | null, roleIds: [] as string[] });
const roleOptions = ref<Array<{ label: string; value: string }>>([]);
const submitting = ref(false);

const chunkMethods = [
  { label: '閫氱敤(naive)', value: 'naive' }, { label: '涔︾睄(book)', value: 'book' },
  { label: '璁烘枃(paper)', value: 'paper' }, { label: '鎵嬪唽(manual)', value: 'manual' },
  { label: '琛ㄦ牸(table)', value: 'table' }, { label: '闂瓟(qa)', value: 'qa' },
  { label: '閭欢(email)', value: 'email' }, { label: '娉曞緥(laws)', value: 'laws' },
  { label: '鍥剧墖(picture)', value: 'picture' }, { label: '婕旂ず(presentation)', value: 'presentation' },
  { label: '鏍囩(tag)', value: 'tag' }, { label: '鍗曞潡(one)', value: 'one' },
];

watch(() => props.visible, (v) => {
  if (v) {
    if (!roleOptions.value.length) {
      fetchGetAllRoles().then(({ data }) => { if (data) roleOptions.value = data.map((r) => ({ label: r.roleName, value: r.id })); });
    }
    if (props.operateType === 'edit' && props.rowData) {
      form.value = { name: props.rowData.name, description: props.rowData.description ?? '', chunkMethod: props.rowData.chunkMethod ?? 'naive', roleIds: props.rowData.roleIds ?? [] };
    } else {
      form.value = { name: '', description: '', chunkMethod: 'naive', roleIds: [] };
    }
  }
});

async function handleSubmit() {
  submitting.value = true;
  try {
    const data = { name: form.value.name, description: form.value.description || undefined, chunkMethod: form.value.chunkMethod ?? undefined, roleIds: form.value.roleIds.length ? form.value.roleIds : undefined };
    const { error } = props.operateType === 'add' ? await fetchCreateKnowledgeBase(data as any) : await fetchUpdateKnowledgeBase(props.rowData!.id, data as any);
    if (!error) { emit('update:visible', false); emit('submitted'); }
  } finally { submitting.value = false; }
}
function handleCancel() { emit('update:visible', false); }
</script>
<template>
  <NModal :show="visible" :title="title" @update:show="emit('update:visible', $event)">
    <NForm :model="form" label-width="100px">
      <NFormItem label="鍚嶇О" required><NInput v-model:value="form.name" placeholder="璇疯緭鍏ョ煡璇嗗簱鍚嶇О" /></NFormItem>
      <NFormItem label="鎻忚堪"><NInput v-model:value="form.description" type="textarea" placeholder="璇疯緭鍏ユ弿杩? /></NFormItem>
      <NFormItem label="鍒嗗潡鏂规硶"><NSelect v-model:value="form.chunkMethod" :options="chunkMethods" /></NFormItem>
      <NFormItem label="鍙闂鑹?><NSelect v-model:value="form.roleIds" multiple :options="roleOptions" placeholder="閫夋嫨鍙闂殑瑙掕壊锛堜笉閫夊垯浠呯鐞嗗憳鍙锛? /></NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleCancel">鍙栨秷</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">纭畾</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
```

- [ ] **Step 5: 鍒涘缓鍒楄〃椤碉紙涓氬姟閫昏緫 < 50 琛岋紝Fix 5锛?*

```vue
<!-- ai-admin/frontend/src/views/knowledge/knowledge-base/index.vue -->
<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { $t } from '@/locales';
import { useAuth } from '@/hooks/business/auth';
import { useBoolean } from '@sa/hooks';
import { useKnowledgeTable } from './composables/use-knowledge-table';
import KnowledgeOperateModal from './modules/knowledge-operate-modal.vue';
import KnowledgeSearchModal from './modules/knowledge-search-modal.vue';
import KnowledgeUploadModal from './modules/knowledge-upload-modal.vue';

const { hasAuth } = useAuth();
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: searchVisible, setTrue: openSearch } = useBoolean();
const { bool: uploadVisible, setTrue: openUpload } = useBoolean();
const { loading, data, searchName, getData, handleDelete, pagination } = useKnowledgeTable();

const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<Api.Knowledge.KnowledgeBase | null>(null);
const searchKb = ref<Api.Knowledge.KnowledgeBase | null>(null);
const uploadKb = ref<Api.Knowledge.KnowledgeBase | null>(null);

function handleAdd() { operateType.value = 'add'; editingData.value = null; openModal(); }
function handleEdit(row: Api.Knowledge.KnowledgeBase) { operateType.value = 'edit'; editingData.value = { ...row }; openModal(); }
function handleSearch(row: Api.Knowledge.KnowledgeBase) { searchKb.value = row; openSearch(); }
function handleUpload(row: Api.Knowledge.KnowledgeBase) { uploadKb.value = row; openUpload(); }

const columns: any[] = [
  { key: 'name', title: '鍚嶇О', minWidth: 150 },
  { key: 'description', title: '鎻忚堪', minWidth: 200, ellipsis: { tooltip: true } },
  { key: 'status', title: '鐘舵€?, width: 90, align: 'center',
    render: (row: Api.Knowledge.KnowledgeBase) => (<NTag type={({ 1: 'warning', 2: 'success', 3: 'error' } as any)[row.status] || 'default'}>
      {{ 1: '瑙ｆ瀽涓?, 2: '灏辩华', 3: '澶辫触' }[row.status] || '鏈煡'}</NTag>),
  },
  { key: 'operate', title: '鎿嶄綔', width: 320, align: 'center',
    render: (row: Api.Knowledge.KnowledgeBase) => (
      <div class="flex-center gap-8px">
        {hasAuth('knowledge:search') && <NButton size="small" onClick={() => handleSearch(row)}>妫€绱?/NButton>}
        {hasAuth('knowledge:add') && <NButton size="small" onClick={() => handleUpload(row)}>涓婁紶</NButton>}
        {hasAuth('knowledge:edit') && <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>缂栬緫</NButton>}
        {hasAuth('knowledge:delete') && <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
          {{ default: () => $t('common.confirmDelete'), trigger: () => <NButton type="error" ghost size="small">鍒犻櫎</NButton> }}
        </NPopconfirm>}
      </div>
    ),
  },
];

getData();
</script>
<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="鐭ヨ瘑搴撶鐞? :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NInput v-model:value="searchName" placeholder="鎼滅储鍚嶇О" clearable style="width: 200px" @keyup.enter="getData" />
          <NButton :loading="loading" @click="getData"><template #icon><icon-ic-round-refresh class="text-icon" /></template>鍒锋柊</NButton>
          <NButton v-permission="'knowledge:add'" type="primary" @click="handleAdd"><template #icon><icon-ic-round-plus class="text-icon" /></template>鏂板</NButton>
        </NSpace>
      </template>
      <NDataTable :columns="columns" :data="data" size="small" :loading="loading" :row-key="row => row.id" :pagination="pagination" remote class="sm:h-full" />
      <KnowledgeOperateModal v-model:visible="visible" :operate-type="operateType" :row-data="editingData" @submitted="getData" />
      <KnowledgeSearchModal v-if="searchKb" v-model:visible="searchVisible" :kb-id="searchKb.id" :kb-name="searchKb.name" />
      <KnowledgeUploadModal v-if="uploadKb" v-model:visible="uploadVisible" :kb-id="uploadKb.id" :kb-name="uploadKb.name" @uploaded="getData" />
    </NCard>
  </div>
</template>
```

- [ ] **Step 6: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/frontend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 7: 鎻愪氦**

```bash
git add ai-admin/frontend/src/views/knowledge/
git commit -m "feat: add knowledge base list page with search and batch upload"
```

---

## Task 11: 鍓嶇璺敱娉ㄥ唽 + i18n

**Files:**
- Modify: `ai-admin/frontend/src/router/elegant/imports.ts`
- Modify: `ai-admin/frontend/src/router/elegant/routes.ts`
- Modify: `ai-admin/frontend/src/router/elegant/transform.ts`
- Modify: `ai-admin/frontend/src/locales/settings/zh-CN.json`
- Modify: `ai-admin/frontend/src/locales/settings/en-US.json`

- [ ] **Step 1: 娣诲姞 view 瀵煎叆**

鍦?`imports.ts` 鐨?`views` 瀵硅薄涓紝`tool_dict` 涔嬪悗娣诲姞锛?
```typescript
  knowledge_knowledge_base: () => import("@/views/knowledge/knowledge-base/index.vue"),
```

娉ㄦ剰锛歋oybean Admin 浣跨敤涓嬪垝绾垮懡鍚?`knowledge_knowledge-base` 鈫?鏂囦欢鍚?`knowledge-base` 瀵瑰簲 key `knowledge_knowledge_base`锛堜笅鍒掔嚎鏇挎崲杩炲瓧绗︼級銆?
瀹為檯涓?`gen-route` 鐢熸垚鐨勬槸 `knowledge_knowledge-base`锛屽洜涓鸿矾寰勬槸 `knowledge/knowledge-base/index.vue`銆傝鎴戠‘璁よ繖涓懡鍚嶏細

璺緞 `/knowledge/knowledge-base/index.vue` 鈫?elegant-router 鐢熸垚 key: `knowledge_knowledge-base`

鎵€浠ュ湪 `imports.ts` 涓細
```typescript
  "knowledge_knowledge-base": () => import("@/views/knowledge/knowledge-base/index.vue"),
```

- [ ] **Step 2: 娣诲姞璺敱瀹氫箟**

鍦?`routes.ts` 涓紝`tool` 璺敱涔嬪悗娣诲姞锛?
```typescript
  {
    name: 'knowledge',
    path: '/knowledge',
    component: 'layout.base',
    meta: {
      title: 'knowledge',
      i18nKey: 'route.knowledge'
    },
    children: [
      {
        name: 'knowledge_knowledge-base',
        path: '/knowledge/knowledge-base',
        component: 'view.knowledge_knowledge-base',
        meta: {
          title: 'knowledge_knowledge-base',
          i18nKey: 'route.knowledge_knowledge-base'
        }
      }
    ]
  },
```

- [ ] **Step 3: 娣诲姞 routeMap**

鍦?`transform.ts` 鐨?`routeMap` 瀵硅薄涓紝`tool_dict` 涔嬪悗娣诲姞锛?
```typescript
  "knowledge": "/knowledge",
  "knowledge_knowledge-base": "/knowledge/knowledge-base",
```

- [ ] **Step 4: 娣诲姞 i18n 缈昏瘧**

鍦?`zh-CN.json` 鐨?`route` 瀵硅薄涓坊鍔狅細

```json
    "knowledge": "鐭ヨ瘑搴?,
    "knowledge_knowledge-base": "鐭ヨ瘑搴撶鐞?
```

鍦?`en-US.json` 鐨?`route` 瀵硅薄涓坊鍔狅細

```json
    "knowledge": "Knowledge",
    "knowledge_knowledge-base": "Knowledge Base"
```

- [ ] **Step 5: 楠岃瘉鍓嶇鍚姩**

```bash
cd ai-admin/frontend
npm run dev
```

璁块棶 `http://localhost:9527`锛岀櫥褰曞悗纭宸︿晶鑿滃崟鍑虹幇"鐭ヨ瘑搴?鐩綍鍜?鐭ヨ瘑搴撶鐞?瀛愯彍鍗曘€?
- [ ] **Step 6: 鎻愪氦**

```bash
git add ai-admin/frontend/src/router/elegant/ ai-admin/frontend/src/locales/
git commit -m "feat: add knowledge base route and i18n"
```

---

## Task 12: 绔埌绔獙璇?
- [ ] **Step 1: 纭繚 RAGFlow 杩愯**

```bash
cd ragflow/docker
docker compose ps
```

棰勬湡锛氭墍鏈夋湇鍔?`Up`锛屽挨鍏舵槸 `ragflow-server` 鍦ㄧ鍙?9380

- [ ] **Step 2: 鑾峰彇 RAGFlow API Token**

1. 璁块棶 `http://localhost:9380`锛岀櫥褰?RAGFlow
2. 鍙充笂瑙掑ご鍍?鈫?API 鈫?鏂板缓 API Token
3. 澶嶅埗 token 鍒?`.env` 鐨?`RAGFLOW_API_KEY=`

- [ ] **Step 3: 閲嶅惎 NestJS 鍚庣**

```bash
cd ai-admin/backend
npm run start:dev
```

- [ ] **Step 4: 娴嬭瘯鍒涘缓鐭ヨ瘑搴?*

```bash
TOKEN=$(curl -s "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userName":"soybean","password":"soybean123"}' | jq -r '.data.token')

curl -s "http://localhost:3000/knowledge/createKnowledgeBase" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"娴嬭瘯鐭ヨ瘑搴?,"description":"杩欐槸涓€涓祴璇?}' | jq .
```

棰勬湡锛歚{ "code": 200, "msg": "ok", "data": null }`

- [ ] **Step 5: 楠岃瘉鏁版嵁搴撹褰?*

```bash
curl -s "http://localhost:3000/knowledge/getKnowledgeBaseList?current=1&size=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
```

棰勬湡锛氳繑鍥炲垰鍒涘缓鐨勭煡璇嗗簱锛屽惈 `datasetId`

- [ ] **Step 6: 楠岃瘉 RAGFlow 鍚屾**

璁块棶 `http://localhost:9380`锛屽湪 RAGFlow 鐣岄潰纭鐭ヨ瘑搴撳凡鍑虹幇銆?
- [ ] **Step 7: 娴嬭瘯鐭ヨ瘑搴撳垪琛ㄩ〉**

鍦ㄥ墠绔?`http://localhost:9527`锛岃繘鍏?鐭ヨ瘑搴?鈫?鐭ヨ瘑搴撶鐞嗭紝纭鍒楄〃鏄剧ず銆?
- [ ] **Step 8: 鎻愪氦锛堝鏈変慨鏀癸級**

```bash
git status
# 濡傛灉鏈変慨鏀瑰垯鎻愪氦
```
---

## Phase 2 鈥?瀵硅瘽鑳藉姏

鍦?Phase 1 鍩虹涓婂鍔犲璇濆姪鎵嬬鐞嗐€佷細璇濈鐞嗐€丼SE 娴佸紡瀵硅瘽銆佽法鐭ヨ瘑搴撴绱€佹枃浠朵笅杞?棰勮銆?
### Task 13: RAGFlow 鏈嶅姟灞傞噸鏋勶紙ragflow/ 瀛愭ā鍧楋級

灏?RagflowApiService 鎸夐鍩熸媶鍒嗕负鐙珛瀛愭湇鍔★紝缁熶竴閫氳繃 RagflowBaseService 澶勭悊 HTTP銆?
**Files:**
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-base.service.ts`
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-chat.service.ts`
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-file.service.ts`
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-search.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.module.ts`

- [ ] **Step 1: 鍒涘缓 RagflowBaseService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-base.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowBaseService {
  protected readonly baseUrl: string;
  protected readonly apiKey: string;
  protected readonly log: AppLoggerService;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('RAGFLOW_BASE_URL');
    this.apiKey = config.get<string>('RAGFLOW_API_KEY', '');
    this.log = new AppLoggerService('RagflowBase');
  }

  async request<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; params?: Record<string, string | number | boolean>; formData?: FormData } = {},
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { method = 'GET', body, params, formData } = options;
    let url = `${this.baseUrl}/api/v1${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) searchParams.set(k, String(v));
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    if (!formData) headers['Content-Type'] = 'application/json';

    this.log.debug(`RAGFlow ${method} ${url}`);
    try {
      const res = await fetch(url, {
        method, headers,
        body: formData ?? (body ? JSON.stringify(body) : undefined),
      });
      const json = await res.json() as { code: number; message?: string; data?: T };
      if (json.code === 0) return { success: true, data: json.data };
      return { success: false, error: json.message || `RAGFlow code ${json.code}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('RAGFlow request failed', msg);
      return { success: false, error: msg };
    }
  }

  async requestWeb<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; params?: Record<string, string | number | boolean>; formData?: FormData } = {},
  ) {
    // 鐢ㄤ簬 RAGFlow web API锛屼緥濡?/v1/llm/*銆傝皟鐢ㄦ柟浼犲畬鏁?path锛屼笉鑷姩鎷?/api/v1銆?    const originalBase = `${this.baseUrl}`;
    const { method = 'GET', body, params, formData } = options;
    let url = `${originalBase}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) searchParams.set(k, String(v));
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    if (!formData) headers['Content-Type'] = 'application/json';
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: formData ?? (body ? JSON.stringify(body) : undefined),
      });
      const json = await res.json() as { code: number; message?: string; data?: T };
      if (json.code === 0) return { success: true, data: json.data };
      return { success: false, error: json.message || `RAGFlow web code ${json.code}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('RAGFlow web request failed', msg);
      return { success: false, error: msg };
    }
  }
}
```

- [ ] **Step 2: 鍒涘缓 RagflowChatService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-chat.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagflowBaseService } from './ragflow-base.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowChatService extends RagflowBaseService {
  protected readonly log = new AppLoggerService('RagflowChat');
  constructor(config: ConfigService) { super(config); }

  async createChat(data: { name: string; dataset_ids: string[]; prompt?: string; llm?: string }) {
    return this.request<{ id: string }>('/chats', { method: 'POST', body: data });
  }

  async listChats(params?: { page?: number; page_size?: number }) {
    return this.request<Array<Record<string, unknown>>>('/chats', { params });
  }

  async updateChat(chatId: string, data: Record<string, unknown>) {
    return this.request(`/chats/${chatId}`, { method: 'PUT', body: data });
  }

  async deleteChat(chatId: string) {
    return this.request(`/chats/${chatId}`, { method: 'DELETE' });
  }

  async createSession(chatId: string, data?: { name?: string }) {
    return this.request<{ id: string }>(`/chats/${chatId}/sessions`, { method: 'POST', body: data ?? {} });
  }

  async listSessions(chatId: string, params?: { page?: number; page_size?: number }) {
    return this.request<Array<Record<string, unknown>>>(`/chats/${chatId}/sessions`, { params });
  }

  async updateSession(chatId: string, sessionId: string, data: { name?: string }) {
    return this.request(`/chats/${chatId}/sessions/${sessionId}`, { method: 'PATCH', body: data });
  }

  async deleteSession(chatId: string, sessionId: string) {
    return this.request(`/chats/${chatId}/sessions`, { method: 'DELETE', body: { ids: [sessionId] } });
  }

  // CH9 鈥?SSE 娴佸紡瀵硅瘽琛ュ叏锛堣繑鍥?ReadableStream 鐢ㄤ簬杞彂锛?  async chatCompletions(chatId: string, sessionId: string, question: string, stream = true): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseUrl}/api/v1/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST', headers,
        body: JSON.stringify({
          chat_id: chatId,
          session_id: sessionId,
          stream,
          messages: [{ role: 'user', content: question }],
        }),
      });
      return res.body;
    } catch (err) {
      this.log.error('Chat completions stream failed', err);
      return null;
    }
  }
}
```

- [ ] **Step 3: 鍒涘缓 RagflowFileService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-file.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagflowBaseService } from './ragflow-base.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowFileService extends RagflowBaseService {
  protected readonly log = new AppLoggerService('RagflowFile');
  constructor(config: ConfigService) { super(config); }

  async downloadFile(docId: string): Promise<{ stream: ReadableStream<Uint8Array> | null; contentType: string }> {
    const url = `${this.baseUrl}/api/v1/documents/${docId}/download`;
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(url, { headers });
    return { stream: res.body, contentType: res.headers.get('content-type') || 'application/octet-stream' };
  }

  async previewFile(docId: string): Promise<{ stream: ReadableStream<Uint8Array> | null; contentType: string }> {
    const url = `${this.baseUrl}/api/v1/documents/${docId}/preview`;
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(url, { headers });
    return { stream: res.body, contentType: res.headers.get('content-type') || 'text/html' };
  }
}
```

- [ ] **Step 4: 鍒涘缓 RagflowSearchService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-search.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagflowBaseService } from './ragflow-base.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowSearchService extends RagflowBaseService {
  protected readonly log = new AppLoggerService('RagflowSearch');
  constructor(config: ConfigService) { super(config); }

  async crossSearch(data: { question: string; dataset_ids?: string[]; top_k?: number; similarity_threshold?: number }) {
    return this.request<{ chunks: Array<Record<string, unknown>>; total: number }>('/searches', {
      method: 'POST', body: data,
    });
  }
}
```

- [ ] **Step 5: 鏇存柊 KnowledgeModule 娉ㄥ唽鏂版湇鍔?*

```typescript
// knowledge.module.ts
import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RagflowApiService } from './ragflow-api.service';
import { RagflowBaseService } from './ragflow/ragflow-base.service';
import { RagflowChatService } from './ragflow/ragflow-chat.service';
import { RagflowFileService } from './ragflow/ragflow-file.service';
import { RagflowSearchService } from './ragflow/ragflow-search.service';

@Module({
  providers: [
    KnowledgeService, ChatService, RagflowApiService,
    RagflowBaseService, RagflowChatService, RagflowFileService, RagflowSearchService,
  ],
  controllers: [KnowledgeController, ChatController],
  exports: [RagflowChatService, RagflowFileService, RagflowSearchService],
})
export class KnowledgeModule {}
```

- [ ] **Step 6: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 7: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/ragflow/ ai-admin/backend/src/knowledge/knowledge.module.ts
git commit -m "refactor: split RAGFlow API service into ragflow/ submodule for Phase 2"
```

---

### Task 14: Phase 2 DTO 鎵╁睍

**Files:**
- Modify: `ai-admin/backend/src/knowledge/dto/knowledge.dto.ts`

- [ ] **Step 1: 杩藉姞 Chat/Session/File/Search DTO**

鍦?`knowledge.dto.ts` 鏈熬娣诲姞锛?
```typescript
// 鈹€鈹€鈹€ Phase 2: Chat 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export class CreateChatDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  datasetIds: string[];

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  llm?: string;
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  datasetIds?: string[];

  @IsOptional()
  @IsString()
  prompt?: string;
}

export class ChatListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_size?: number = 10;
}

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class ChatCompletionDto {
  @IsString()
  sessionId: string;

  @IsString()
  question: string;

  @IsOptional()
  stream?: boolean = true;
}

// 鈹€鈹€鈹€ Phase 2: Cross-KB Search 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export class CrossSearchDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  datasetIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  top_k?: number = 10;

  @IsOptional()
  @Type(() => Number)
  similarity_threshold?: number = 0.2;
}
```

- [ ] **Step 2: 楠岃瘉缂栬瘧骞舵彁浜?*

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
git add ai-admin/backend/src/knowledge/dto/knowledge.dto.ts
git commit -m "feat: add Phase 2 DTOs for chat, session, file, cross-KB search"
```

---

### Task 15: Chat 绠＄悊 + SSE 娴佸紡鍚庣

**Files:**
- Create: `ai-admin/backend/src/knowledge/chat.service.ts`
- Create: `ai-admin/backend/src/knowledge/chat.controller.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.module.ts`

- [ ] **Step 1: 鍒涘缓 ChatService**

```typescript
// ai-admin/backend/src/knowledge/chat.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { RagflowChatService } from './ragflow/ragflow-chat.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CreateChatDto, UpdateChatDto, CreateSessionDto, ChatCompletionDto } from './dto/knowledge.dto';

@Injectable()
export class ChatService {
  private readonly log = new AppLoggerService('ChatService');
  constructor(private ragflowChat: RagflowChatService) {}

  async getChatList(params: { page?: number; page_size?: number }) {
    this.log.debug('getChatList', params);
    const { success, data, error } = await this.ragflowChat.listChats(params);
    if (!success) throw new BadRequestException(`鑾峰彇鍔╂墜鍒楄〃澶辫触锛?{error}`);
    return { records: data ?? [], total: (data as Array<unknown>)?.length ?? 0 };
  }

  async createChat(dto: CreateChatDto) {
    this.log.info('createChat', { name: dto.name });
    const { success, data, error } = await this.ragflowChat.createChat({
      name: dto.name, dataset_ids: dto.datasetIds,
      prompt: dto.prompt, llm: dto.llm,
    });
    if (!success) throw new BadRequestException(`鍒涘缓鍔╂墜澶辫触锛?{error}`);
    this.log.info('createChat success', { chatId: (data as Record<string, string>)?.id });
    return data;
  }

  async updateChat(chatId: string, dto: UpdateChatDto) {
    this.log.info('updateChat', { chatId });
    const { success, error } = await this.ragflowChat.updateChat(chatId, {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.datasetIds ? { dataset_ids: dto.datasetIds } : {}),
      ...(dto.prompt ? { prompt: dto.prompt } : {}),
    });
    if (!success) throw new BadRequestException(`鏇存柊鍔╂墜澶辫触锛?{error}`);
    this.log.info('updateChat success', { chatId });
    return null;
  }

  async deleteChat(chatId: string) {
    this.log.info('deleteChat', { chatId });
    const { success, error } = await this.ragflowChat.deleteChat(chatId);
    if (!success) throw new BadRequestException(`鍒犻櫎鍔╂墜澶辫触锛?{error}`);
    this.log.info('deleteChat success', { chatId });
    return null;
  }

  async getSessionList(chatId: string, params?: { page?: number; page_size?: number }) {
    const { success, data, error } = await this.ragflowChat.listSessions(chatId, params);
    if (!success) throw new BadRequestException(`鑾峰彇浼氳瘽鍒楄〃澶辫触锛?{error}`);
    return { records: data ?? [], total: (data as Array<unknown>)?.length ?? 0 };
  }

  async createSession(chatId: string, dto?: CreateSessionDto) {
    this.log.info('createSession', { chatId });
    const { success, data, error } = await this.ragflowChat.createSession(chatId, dto);
    if (!success) throw new BadRequestException(`鍒涘缓浼氳瘽澶辫触锛?{error}`);
    return data;
  }

  async deleteSession(chatId: string, sessionId: string) {
    this.log.info('deleteSession', { chatId, sessionId });
    const { success, error } = await this.ragflowChat.deleteSession(chatId, sessionId);
    if (!success) throw new BadRequestException(`鍒犻櫎浼氳瘽澶辫触锛?{error}`);
    return null;
  }

  async chatCompletions(chatId: string, dto: ChatCompletionDto) {
    const stream = await this.ragflowChat.chatCompletions(chatId, dto.sessionId, dto.question, dto.stream ?? true);
    if (!stream) throw new BadRequestException('鑾峰彇瀵硅瘽娴佸け璐?);
    return stream;
  }
}
```

- [ ] **Step 2: 鍒涘缓 ChatController**

```typescript
// ai-admin/backend/src/knowledge/chat.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { OperationLog } from '../common/decorators/operation-log.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto, UpdateChatDto, CreateSessionDto, ChatCompletionDto, ChatListDto } from './dto/knowledge.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';

@ApiTags('瀵硅瘽鍔╂墜')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private readonly log = new AppLoggerService('ChatController');
  constructor(private chatService: ChatService) {}

  @Get('getChatList')
  getChatList(@Query() dto: ChatListDto) {
    return this.chatService.getChatList(dto);
  }

  @Permissions('knowledge:chat')
  @OperationLog('瀵硅瘽鍔╂墜', '鍒涘缓鍔╂墜')
  @Post('createChat')
  createChat(@Body() dto: CreateChatDto) {
    return this.chatService.createChat(dto);
  }

  @Permissions('knowledge:chat')
  @OperationLog('瀵硅瘽鍔╂墜', '鏇存柊鍔╂墜')
  @Put('updateChat/:chatId')
  updateChat(@Param('chatId') chatId: string, @Body() dto: UpdateChatDto) {
    return this.chatService.updateChat(chatId, dto);
  }

  @Permissions('knowledge:chat')
  @OperationLog('瀵硅瘽鍔╂墜', '鍒犻櫎鍔╂墜')
  @Delete('deleteChat/:chatId')
  deleteChat(@Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId);
  }

  @Get('getSessionList/:chatId')
  getSessionList(@Param('chatId') chatId: string, @Query() dto: ChatListDto) {
    return this.chatService.getSessionList(chatId, dto);
  }

  @Post('createSession/:chatId')
  createSession(@Param('chatId') chatId: string, @Body() dto: CreateSessionDto) {
    return this.chatService.createSession(chatId, dto);
  }

  @Permissions('knowledge:chat')
  @OperationLog('瀵硅瘽鍔╂墜', '鍒犻櫎浼氳瘽')
  @Delete('deleteSession/:chatId/:sessionId')
  deleteSession(@Param('chatId') chatId: string, @Param('sessionId') sessionId: string) {
    return this.chatService.deleteSession(chatId, sessionId);
  }

  // SSE 娴佸紡瀵硅瘽锛圥hase 2 鏍稿績鍔熻兘锛?  @Post('completions/:chatId')
  @HttpCode(200)
  async chatCompletions(@Param('chatId') chatId: string, @Body() dto: ChatCompletionDto, @Res() res: Response) {
    const stream = await this.chatService.chatCompletions(chatId, dto);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const reader = stream.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(value);
        }
      } catch (err) {
        this.log.error('SSE stream error', err);
        res.end();
      }
    };
    pump();
  }
}
```

- [ ] **Step 3: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 4: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/chat.service.ts ai-admin/backend/src/knowledge/chat.controller.ts
git commit -m "feat: add chat assistant CRUD, session management and SSE streaming"
```

---

### Task 16: 鏂囦欢涓嬭浇/棰勮 + 璺ㄧ煡璇嗗簱妫€绱?
**Files:**
- Modify: `ai-admin/backend/src/knowledge/knowledge.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.controller.ts`

- [ ] **Step 1: 鍦?KnowledgeService 娣诲姞鏂囦欢浠ｇ悊鍜岃法搴撴悳绱㈡柟娉?*

```typescript
// 鍦?knowledge.service.ts 鏈熬 constructor 涔嬪悗娣诲姞

// 鈹€鈹€鈹€ Phase 2: File Proxy 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async downloadFile(docId: string) {
  this.log.info('downloadFile', { docId });
  return this.ragflowFile.downloadFile(docId);
}

async previewFile(docId: string) {
  return this.ragflowFile.previewFile(docId);
}

// 鈹€鈹€鈹€ Phase 2: Cross-KB Search 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async crossSearch(dto: { question: string; datasetIds?: string[]; top_k?: number; similarity_threshold?: number }) {
  this.log.debug('crossSearch', { question: dto.question.substring(0, 50) });
  const { success, data, error } = await this.ragflowSearch.crossSearch({
    question: dto.question,
    dataset_ids: dto.datasetIds,
    top_k: dto.top_k,
    similarity_threshold: dto.similarity_threshold,
  });
  if (!success) throw new BadRequestException(`璺ㄥ簱妫€绱㈠け璐ワ細${error}`);
  return data;
}
```

鍚屾椂闇€瑕佸湪 `knowledge.service.ts` 鐨?constructor 涓敞鍏?`RagflowFileService` 鍜?`RagflowSearchService`銆?
- [ ] **Step 2: 鍦?KnowledgeController 娣诲姞绔偣**

```typescript
// 鍦?knowledge.controller.ts 涓坊鍔?
// 鈹€鈹€鈹€ Phase 2: File 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

@Permissions('knowledge:search')
@Get('downloadDocument/:docId')
async downloadDocument(@Param('docId') docId: string, @Res() res: Response) {
  const { stream, contentType } = await this.knowledgeService.downloadFile(docId);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${docId}"`);
  if (stream) {
    const reader = stream.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(value);
        }
      } catch (err) { res.end(); }
    };
    pump();
  } else { res.end(); }
}

@Permissions('knowledge:search')
@Get('previewDocument/:docId')
async previewDocument(@Param('docId') docId: string, @Res() res: Response) {
  const { stream, contentType } = await this.knowledgeService.previewFile(docId);
  res.setHeader('Content-Type', contentType);
  if (stream) {
    const reader = stream.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(value);
        }
      } catch (err) { res.end(); }
    };
    pump();
  } else { res.end(); }
}

// 鈹€鈹€鈹€ Phase 2: Cross-KB Search 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

@Permissions('knowledge:search')
@Post('crossSearch')
crossSearch(@Body() dto: CrossSearchDto) {
  return this.knowledgeService.crossSearch(dto);
}
```

骞舵坊鍔?`@Res` 瀵煎叆锛歚import { Response } from 'express';`锛屽皢 `CrossSearchDto` 鍔犲叆宸叉湁 imports銆?
- [ ] **Step 3: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 4: 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/knowledge.service.ts ai-admin/backend/src/knowledge/knowledge.controller.ts
git commit -m "feat: add file download/preview and cross-KB search"
```

---

### Task 17: 鍓嶇 Chat 绠＄悊椤甸潰

**Files:**
- Create: `ai-admin/frontend/src/views/knowledge/chat/index.vue`
- Create: `ai-admin/frontend/src/views/knowledge/chat/modules/chat-operate-modal.vue`
- Modify: `ai-admin/frontend/src/typings/api/knowledge.d.ts`

- [ ] **Step 1: 娣诲姞鍓嶇绫诲瀷**

鍦?`typings/api/knowledge.d.ts` 鐨?`namespace Knowledge` 鍐呮坊鍔狅細

```typescript
type ChatItem = {
  id: string;
  name: string;
  dataset_ids: string[];
  prompt: string | null;
  llm: string | null;
  status: string;
  create_time: string;
};

type ChatSearchParams = { page?: number; page_size?: number };

type SessionItem = {
  id: string;
  name: string;
  message_count: number;
  create_time: string;
};

type CrossSearchParams = {
  question: string;
  datasetIds?: string[];
  top_k?: number;
  similarity_threshold?: number;
};
```

- [ ] **Step 2: 鍒涘缓 Chat 鍒楄〃椤?*

```vue
<!-- ai-admin/frontend/src/views/knowledge/chat/index.vue -->
<script setup lang="tsx">
import { ref, onMounted } from 'vue';
import { NButton, NSpace, NCard, NDataTable, NPopconfirm } from 'naive-ui';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import { fetchGetChatList, fetchDeleteChat } from '@/service/api/knowledge';
import ChatOperateModal from './modules/chat-operate-modal.vue';

const { hasAuth } = useAuth();
const loading = ref(false);
const chats = ref<Api.Knowledge.ChatItem[]>([]);
const visible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<Api.Knowledge.ChatItem | null>(null);

async function getData() {
  loading.value = true;
  try {
    const { error, data } = await fetchGetChatList({ page: 1, page_size: 50 });
    if (!error && data) chats.value = data.records;
  } finally { loading.value = false; }
}

function handleAdd() { operateType.value = 'add'; editingData.value = null; visible.value = true; }
function handleEdit(row: Api.Knowledge.ChatItem) { operateType.value = 'edit'; editingData.value = { ...row }; visible.value = true; }
async function handleDelete(id: string) {
  const { error } = await fetchDeleteChat(id);
  if (!error) getData();
}

const columns = [
  { key: 'name', title: '鍚嶇О', minWidth: 150 },
  { key: 'dataset_ids', title: '鍏宠仈鐭ヨ瘑搴?, ellipsis: { tooltip: true } },
  { key: 'prompt', title: '绯荤粺鎻愮ず璇?, ellipsis: { tooltip: true } },
  { key: 'create_time', title: '鍒涘缓鏃堕棿', width: 180 },
  { key: 'operate', title: '鎿嶄綔', width: 200,
    render: (row: Api.Knowledge.ChatItem) => (
      <div class="flex-center gap-8px">
        {hasAuth('knowledge:chat') && <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>缂栬緫</NButton>}
        {hasAuth('knowledge:chat') && <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
          {{ default: () => $t('common.confirmDelete'), trigger: () => <NButton type="error" ghost size="small">鍒犻櫎</NButton> }}
        </NPopconfirm>}
      </div>
    ),
  },
];

onMounted(() => getData());
</script>
<template>
  <NCard title="瀵硅瘽鍔╂墜绠＄悊" :bordered="false" size="small">
    <template #header-extra>
      <NButton v-permission="'knowledge:chat'" type="primary" @click="handleAdd">鏂板鍔╂墜</NButton>
    </template>
    <NDataTable :columns="columns" :data="chats" :loading="loading" />
    <ChatOperateModal v-model:visible="visible" :operate-type="operateType" :row-data="editingData" @submitted="getData" />
  </NCard>
</template>
```

- [ ] **Step 3: 鍒涘缓 Chat 缂栬緫寮圭獥**

```vue
<!-- ai-admin/frontend/src/views/knowledge/chat/modules/chat-operate-modal.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NSpace } from 'naive-ui';
import { fetchCreateChat, fetchUpdateChat, fetchGetKnowledgeBaseList } from '@/service/api/knowledge';

interface Props { visible: boolean; operateType: 'add' | 'edit'; rowData?: Api.Knowledge.ChatItem | null; }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'submitted'): void }>();
const title = computed(() => props.operateType === 'add' ? '鏂板缓瀵硅瘽鍔╂墜' : '缂栬緫瀵硅瘽鍔╂墜');
const form = ref({ name: '', datasetIds: [] as string[], prompt: '' });
const kbOptions = ref<Array<{ label: string; value: string }>>([]);
const submitting = ref(false);

watch(() => props.visible, (v) => {
  if (v) {
    if (!kbOptions.value.length) {
      fetchGetKnowledgeBaseList({ current: 1, size: 100 }).then(({ data }) => {
        if (data) kbOptions.value = data.records
          .filter((kb: any) => kb.datasetId)
          .map((kb: any) => ({ label: kb.name, value: kb.datasetId }));
      });
    }
    if (props.operateType === 'edit' && props.rowData) {
      form.value = { name: props.rowData.name, datasetIds: props.rowData.dataset_ids || [], prompt: props.rowData.prompt || '' };
    } else { form.value = { name: '', datasetIds: [], prompt: '' }; }
  }
});

async function handleSubmit() {
  submitting.value = true;
  try {
    const dto = { ...form.value, prompt: form.value.prompt || undefined };
    const { error } = props.operateType === 'add'
      ? await fetchCreateChat(dto)
      : await fetchUpdateChat(props.rowData!.id, dto);
    if (!error) { emit('update:visible', false); emit('submitted'); }
  } finally { submitting.value = false; }
}
</script>
<template>
  <NModal :show="visible" :title="title" @update:show="emit('update:visible', $event)">
    <NForm :model="form" label-width="100px">
      <NFormItem label="鍚嶇О" required><NInput v-model:value="form.name" placeholder="璇疯緭鍏ュ姪鎵嬪悕绉? /></NFormItem>
      <NFormItem label="鍏宠仈鐭ヨ瘑搴?><NSelect v-model:value="form.datasetIds" multiple :options="kbOptions" placeholder="閫夋嫨鍏宠仈鐨勭煡璇嗗簱" /></NFormItem>
      <NFormItem label="绯荤粺鎻愮ず璇?><NInput v-model:value="form.prompt" type="textarea" placeholder="鍙€夌殑绯荤粺鎻愮ず璇? /></NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:visible', false)">鍙栨秷</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">纭畾</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
```

- [ ] **Step 4: 楠岃瘉缂栬瘧骞舵彁浜?*

```bash
cd ai-admin/frontend
npx tsc --noEmit --pretty
git add ai-admin/frontend/src/views/knowledge/chat/ ai-admin/frontend/src/typings/api/knowledge.d.ts
git commit -m "feat: add chat management frontend page"
```

---

### Task 18: 鍓嶇 SSE 娴佸紡瀵硅瘽鐣岄潰

**Files:**
- Create: `ai-admin/frontend/src/views/knowledge/chat/modules/chat-conversation.vue`

- [ ] **Step 1: 鍒涘缓娴佸紡瀵硅瘽缁勪欢**

```vue
<!-- ai-admin/frontend/src/views/knowledge/chat/modules/chat-conversation.vue -->
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { NModal, NInput, NButton, NSpace, NScrollbar, NSpin } from 'naive-ui';

interface Props { visible: boolean; chatId: string; sessionId: string; chatName: string; }
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>();
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
const question = ref('');
const loading = ref(false);

async function handleSend() {
  if (!question.value.trim() || loading.value) return;
  const text = question.value;
  messages.value.push({ role: 'user', content: text });
  question.value = '';
  loading.value = true;
  messages.value.push({ role: 'assistant', content: '' });
  await nextTick();

  try {
    const res = await fetch(`/proxy-default/chat/completions/${props.chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: props.sessionId, question: text, stream: true }),
    });
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.answer) messages.value[messages.value.length - 1].content += data.answer;
        } catch { /* skip partial */ }
      }
    }
  } catch {
    messages.value[messages.value.length - 1].content = '杩炴帴澶辫触锛岃閲嶈瘯';
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <NModal :show="visible" title="瀵硅瘽" style="width: 700px" @update:show="emit('update:visible', $event)">
    <div class="p-4">
      <div class="mb-2 text-sm text-gray-500">{{ chatName }}</div>
      <NScrollbar style="max-height: 400px" class="border rounded-lg p-3 mb-4">
        <div v-for="(msg, idx) in messages" :key="idx" class="mb-3" :class="msg.role === 'user' ? 'text-right' : 'text-left'">
          <div class="inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm"
            :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100'">
            <div v-if="msg.role === 'assistant' && idx === messages.length - 1 && loading && !msg.content"><NSpin size="small" /></div>
            <div v-else style="white-space: pre-wrap">{{ msg.content }}</div>
          </div>
        </div>
      </NScrollbar>
      <NSpace>
        <NInput v-model:value="question" placeholder="杈撳叆闂..." clearable @keyup.enter="handleSend" />
        <NButton type="primary" :loading="loading" @click="handleSend">鍙戦€?/NButton>
      </NSpace>
    </div>
  </NModal>
</template>
```

- [ ] **Step 2: 鎻愪氦**

```bash
git add ai-admin/frontend/src/views/knowledge/chat/modules/chat-conversation.vue
git commit -m "feat: add SSE streaming chat conversation component"
```

---

### Task 19: Phase 2 鍓嶇 API 鍑芥暟 + 璺敱 + i18n + 绉嶅瓙鏁版嵁

**Files:**
- Modify: `ai-admin/frontend/src/service/api/knowledge.ts`
- Modify: `ai-admin/frontend/src/router/elegant/imports.ts`
- Modify: `ai-admin/frontend/src/router/elegant/routes.ts`
- Modify: `ai-admin/frontend/src/router/elegant/transform.ts`
- Modify: `ai-admin/frontend/src/locales/settings/zh-CN.json`
- Modify: `ai-admin/frontend/src/locales/settings/en-US.json`
- Modify: `ai-admin/backend/prisma/seed.ts`

- [ ] **Step 1: 娣诲姞 Chat API 鍑芥暟**

鍦?`service/api/knowledge.ts` 鏈熬杩藉姞锛?
```typescript
// 鈹€鈹€鈹€ Phase 2: Chat 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export function fetchGetChatList(params?: { page?: number; page_size?: number }) {
  return request<{ records: Api.Knowledge.ChatItem[]; total: number }>({ url: '/chat/getChatList', method: 'get', params });
}

export function fetchCreateChat(data: { name: string; datasetIds: string[]; prompt?: string }) {
  return request<null>({ url: '/chat/createChat', method: 'post', data });
}

export function fetchUpdateChat(id: string, data: { name?: string; datasetIds?: string[]; prompt?: string }) {
  return request<null>({ url: `/chat/updateChat/${id}`, method: 'put', data });
}

export function fetchDeleteChat(id: string) {
  return request<null>({ url: `/chat/deleteChat/${id}`, method: 'delete' });
}

export function fetchGetSessionList(chatId: string, params?: { page?: number; page_size?: number }) {
  return request<{ records: Api.Knowledge.SessionItem[]; total: number }>({ url: `/chat/getSessionList/${chatId}`, method: 'get', params });
}

export function fetchCreateSession(chatId: string, data?: { name?: string }) {
  return request<{ id: string }>({ url: `/chat/createSession/${chatId}`, method: 'post', data });
}

export function fetchDeleteSession(chatId: string, sessionId: string) {
  return request<null>({ url: `/chat/deleteSession/${chatId}/${sessionId}`, method: 'delete' });
}

// 鈹€鈹€鈹€ Phase 2: Cross-KB Search 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export function fetchCrossSearch(data: Api.Knowledge.CrossSearchParams) {
  return request<{ chunks: Array<Record<string, unknown>>; total: number }>({ url: '/knowledge/crossSearch', method: 'post', data });
}
```

- [ ] **Step 2: 娣诲姞鍓嶇璺敱**

鍦?`imports.ts` 娣诲姞锛?```typescript
  "knowledge_chat": () => import("@/views/knowledge/chat/index.vue"),
```

鍦?`routes.ts` 鐨?`knowledge_knowledge-base` 鍚岀骇 children 涓坊鍔狅細
```typescript
  {
    name: 'knowledge_chat',
    path: '/knowledge/chat',
    component: 'view.knowledge_chat',
    meta: { title: 'knowledge_chat', i18nKey: 'route.knowledge_chat' }
  },
```

鍦?`transform.ts` 娣诲姞锛?```typescript
  "knowledge_chat": "/knowledge/chat",
```

- [ ] **Step 3: 娣诲姞 i18n 缈昏瘧**

鍦?`zh-CN.json` 鐨?`route` 瀵硅薄涓坊鍔狅細
```json
    "knowledge_chat": "瀵硅瘽鍔╂墜"
```

鍦?`en-US.json` 娣诲姞锛?```json
    "knowledge_chat": "Chat"
```

- [ ] **Step 4: 鍦?seed.ts 娣诲姞瀵硅瘽鍔╂墜鑿滃崟 + 鎸夐挳鏉冮檺**

鍦?`knowledgeMenu` 鐨?`knowledge_knowledge-base` 瀛愯彍鍗曚箣鍚庢坊鍔狅細
```typescript
  // 瀵硅瘽鍔╂墜绠＄悊椤甸潰
  await prisma.menu.create({
    data: {
      parentId: knowledgeMenu.id, type: 2, name: 'knowledge_chat',
      path: '/knowledge/chat', component: 'layout.base$view.knowledge_chat',
      icon: 'carbon:chat-bot', sort: 2, status: 1,
    },
  });
```

鍦?`buttonGroups` 涓坊鍔狅細
```typescript
  { page: 'knowledge_chat', prefix: 'knowledge', label: '瀵硅瘽鍔╂墜' },
```

鐢变簬 `knowledge:chat` 鎸夐挳鏉冮檺灏嗛€氳繃鑷姩鐢熸垚鑾峰緱锛堝熀浜?buttonGroups锛夛紝鏃犻渶鎵嬪姩娣诲姞銆?
- [ ] **Step 5: 楠岃瘉缂栬瘧**

```bash
cd ai-admin/frontend && npx tsc --noEmit --pretty
cd ../backend && npx tsc --noEmit --pretty
```

棰勬湡锛氱紪璇戦€氳繃

- [ ] **Step 6: 鎻愪氦**

```bash
git add ai-admin/frontend/src/service/api/knowledge.ts ai-admin/frontend/src/router/elegant/ ai-admin/frontend/src/locales/ ai-admin/backend/prisma/seed.ts
git commit -m "feat: add Phase 2 routes, i18n, API functions and seed data"
```

---

## Phase 3 鈥?杩涢樁鍔熻兘

鍦?Phase 1 + Phase 2 鍩虹涓婂鍔犵煡璇嗗簱璇︽儏銆佹枃妗ｇ簿缁嗗寲鎿嶄綔銆佸垏鐗囩鐞嗐€佹櫤鑳戒綋绠＄悊銆丩LM 閰嶇疆銆?
### Task 20: 鐭ヨ瘑搴撹鎯?+ 鏂囨。绮剧粏鍖栨搷浣?
**Files:**
- Modify: `ai-admin/backend/src/knowledge/ragflow-api.service.ts`
- Modify: `ai-admin/backend/src/knowledge/dto/knowledge.dto.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.controller.ts`

- [ ] **Step 1: 鍦?RagflowApiService 涓坊鍔?Phase 3 鏂规硶**

```typescript
// 鍦?ragflow-api.service.ts 涓坊鍔?
// D3 鈥?鐭ヨ瘑搴撹鎯?async getDatasetDetail(datasetId: string) {
  return this.request<Record<string, unknown>>(`/datasets/${datasetId}`);
}

// DO4 鈥?鏂囨。璇︽儏
async getDocumentDetail(datasetId: string, docId: string) {
  return this.request<Record<string, unknown>>(`/datasets/${datasetId}/documents/${docId}`);
}

// DO5 鈥?鏇存柊鏂囨。鍏冩暟鎹?async updateDocumentMeta(datasetId: string, docId: string, data: { name?: string; chunk_method?: string; parser_config?: Record<string, unknown> }) {
  return this.request(`/datasets/${datasetId}/documents/${docId}`, { method: 'PATCH', body: data });
}

// DO6 鈥?鍗曟枃妗ｈВ鏋愩€俁AGFlow 娌℃湁 /documents/{docId}/chunk 瑙ｆ瀽绔偣锛屽繀椤昏皟鐢?parse 骞朵紶 document_ids銆?async parseSingleDocument(datasetId: string, docId: string) {
  return this.request(`/datasets/${datasetId}/documents/parse`, {
    method: 'POST',
    body: { document_ids: [docId] },
  });
}

// DO8 鈥?鍋滄瑙ｆ瀽銆俁AGFlow 瑕佹眰 document_ids锛屼笉鑳芥棤鍙傚仠姝㈡暣涓煡璇嗗簱銆?async stopParsing(datasetId: string, documentIds: string[]) {
  return this.request(`/datasets/${datasetId}/documents/stop`, {
    method: 'POST',
    body: { document_ids: documentIds },
  });
}
```

- [ ] **Step 2: DTO 鎵╁厖**

鍦?`knowledge.dto.ts` 鏈熬娣诲姞锛?
```typescript
// 鈹€鈹€鈹€ Phase 3 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export class UpdateDocumentMetaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  chunk_method?: string;

  @IsOptional()
  @IsObject()
  parser_config?: Record<string, unknown>;
}

export class ParseSingleDocumentDto {
  @IsString()
  docId: string;
}

export class ChunkListDto {
  @IsString()
  documentId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_size?: number = 10;

  @IsOptional()
  @IsString()
  keywords?: string;
}

export class UpdateChunkDto {
  @IsString()
  documentId: string;

  @IsString()
  chunkId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  important_keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questions?: string[];

  @IsOptional()
  available?: boolean;
}

export class DeleteChunksDto {
  @IsString()
  documentId: string;

  @IsArray()
  @IsString({ each: true })
  chunkIds: string[];
}

// 鍒囩墖鍏抽敭璇嶈繃婊ゅ鐢?ChunkListDto.keywords銆?// 璺ㄦ枃妗?璺ㄧ煡璇嗗簱璇箟妫€绱㈠鐢?SearchDto 鎴?Phase 2 CrossKbSearchDto锛屼笉鍗曠嫭铏氭瀯 /chunks/search銆?```

- [ ] **Step 3: 鍦?KnowledgeService 涓坊鍔犱笟鍔℃柟娉?*

```typescript
async getDatasetDetail(datasetId: string) {
  const { success, data, error } = await this.ragflow.getDatasetDetail(datasetId);
  if (!success) throw new BadRequestException(`鑾峰彇鐭ヨ瘑搴撹鎯呭け璐ワ細${error}`);
  return data;
}

async getDocumentDetail(kbId: string, docId: string) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, data, error } = await this.ragflow.getDocumentDetail(kb.datasetId, docId);
  if (!success) throw new BadRequestException(`鑾峰彇鏂囨。璇︽儏澶辫触锛?{error}`);
  return data;
}

async updateDocumentMeta(kbId: string, docId: string, dto: UpdateDocumentMetaDto) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, error } = await this.ragflow.updateDocumentMeta(kb.datasetId, docId, dto);
  if (!success) throw new BadRequestException(`鏇存柊鏂囨。澶辫触锛?{error}`);
  this.log.info('updateDocumentMeta success', { kbId, docId });
  return null;
}

async parseSingleDocument(kbId: string, docId: string) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, error } = await this.ragflow.parseSingleDocument(kb.datasetId, docId);
  if (!success) throw new BadRequestException(`瑙ｆ瀽鏂囨。澶辫触锛?{error}`);
  this.log.info('parseSingleDocument success', { kbId, docId });
  return null;
}

async stopParsing(kbId: string, documentIds: string[]) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, error } = await this.ragflow.stopParsing(kb.datasetId, documentIds);
  if (!success) throw new BadRequestException(`鍋滄瑙ｆ瀽澶辫触锛?{error}`);
  this.log.info('stopParsing success', { kbId, documentIds });
  return null;
}
```

- [ ] **Step 4: 鍦?Controller 涓坊鍔犲搴旂鐐?*

```typescript
// D3
@Permissions('knowledge:edit')
@Get('getDatasetDetail/:datasetId')
getDatasetDetail(@Param('datasetId') datasetId: string) {
  return this.knowledgeService.getDatasetDetail(datasetId);
}

// DO4
@Permissions('knowledge:edit')
@Get('getDocumentDetail/:kbId/:docId')
getDocumentDetail(@Param('kbId') kbId: string, @Param('docId') docId: string) {
  return this.knowledgeService.getDocumentDetail(kbId, docId);
}

// DO5
@Permissions('knowledge:edit')
@OperationLog('鐭ヨ瘑搴?, '鏇存柊鏂囨。鍏冩暟鎹?)
@Put('updateDocumentMeta/:kbId/:docId')
updateDocumentMeta(@Param('kbId') kbId: string, @Param('docId') docId: string, @Body() dto: UpdateDocumentMetaDto) {
  return this.knowledgeService.updateDocumentMeta(kbId, docId, dto);
}

// DO6
@Permissions('knowledge:add')
@OperationLog('鐭ヨ瘑搴?, '瑙ｆ瀽鍗曟枃妗?)
@Post('parseSingleDocument/:kbId/:docId')
parseSingleDocument(@Param('kbId') kbId: string, @Param('docId') docId: string) {
  return this.knowledgeService.parseSingleDocument(kbId, docId);
}

// DO8
@Permissions('knowledge:add')
@OperationLog('鐭ヨ瘑搴?, '鍋滄瑙ｆ瀽')
@Post('stopParsing/:kbId')
stopParsing(@Param('kbId') kbId: string, @Body() dto: ParseDocumentDto) {
  return this.knowledgeService.stopParsing(kbId, dto.ids);
}
```

- [ ] **Step 5: 楠岃瘉缂栬瘧 + 鎻愪氦**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
git add ai-admin/backend/src/knowledge/
git commit -m "feat: add dataset detail, doc detail, single doc parse, stop parse, doc meta edit"
```

---

### Task 21: 鍒囩墖绠＄悊锛圕hunk API锛?
**Files:**
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-chunk.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.module.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.controller.ts`

- [ ] **Step 1: 鍒涘缓 RagflowChunkService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-chunk.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagflowBaseService } from './ragflow-base.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowChunkService extends RagflowBaseService {
  protected readonly log = new AppLoggerService('RagflowChunk');
  constructor(config: ConfigService) { super(config); }

  // C1 鈥?鍒囩墖鍒楄〃銆俁AGFlow Chunk 鏄?document 绾ц祫婧愶紝蹇呴』甯?documentId銆?  async listChunks(datasetId: string, documentId: string, params?: { page?: number; page_size?: number; keywords?: string }) {
    return this.request<Array<Record<string, unknown>>>(`/datasets/${datasetId}/documents/${documentId}/chunks`, { params });
  }

  // C2 鈥?鏇存柊鍗曚釜鍒囩墖
  async updateChunk(datasetId: string, documentId: string, chunkId: string, data: Record<string, unknown>) {
    return this.request(`/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`, { method: 'PATCH', body: data });
  }

  // C3 鈥?鍒犻櫎鍒囩墖
  async deleteChunks(datasetId: string, documentId: string, chunkIds: string[]) {
    return this.request(`/datasets/${datasetId}/documents/${documentId}/chunks`, {
      method: 'DELETE',
      body: { chunk_ids: chunkIds },
    });
  }

  // C4 鈥?鍚敤/绂佺敤鍒囩墖
  async switchChunks(datasetId: string, documentId: string, chunkIds: string[], available: boolean) {
    return this.request(`/datasets/${datasetId}/documents/${documentId}/chunks`, {
      method: 'PATCH',
      body: { chunk_ids: chunkIds, available },
    });
  }
}
```

- [ ] **Step 2: 娉ㄥ唽鍒?Module + Service 濮旀墭鏂规硶 + Controller 绔偣**

鍦?`knowledge.module.ts` providers 涓坊鍔?`RagflowChunkService`銆?
KnowledgeService 濮旀墭鏂规硶锛堢洿鎺ヤ唬鐞嗗埌 ragflow锛夛細
```typescript
import { RagflowChunkService } from './ragflow/ragflow-chunk.service';
// 鍦?constructor 娉ㄥ叆

async getChunkList(kbId: string, params: ChunkListDto) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, data, error } = await this.ragflowChunk.listChunks(kb.datasetId, params.documentId, params);
  if (!success) throw new BadRequestException(`鑾峰彇鍒囩墖澶辫触锛?{error}`);
  return data;
}

async updateChunk(kbId: string, dto: UpdateChunkDto) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, error } = await this.ragflowChunk.updateChunk(kb.datasetId, dto.documentId, dto.chunkId, dto);
  if (!success) throw new BadRequestException(`鏇存柊鍒囩墖澶辫触锛?{error}`);
  return null;
}

async deleteChunks(kbId: string, dto: DeleteChunksDto) {
  const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb?.datasetId) throw new NotFoundException('鐭ヨ瘑搴撲笉瀛樺湪');
  const { success, error } = await this.ragflowChunk.deleteChunks(kb.datasetId, dto.documentId, dto.chunkIds);
  if (!success) throw new BadRequestException(`鍒犻櫎鍒囩墖澶辫触锛?{error}`);
  return null;
}
```

Controller 绔偣锛?```typescript
@Permissions('knowledge:search')
@Get('getChunkList/:kbId')
getChunkList(@Param('kbId') kbId: string, @Query() dto: ChunkListDto) {
  return this.knowledgeService.getChunkList(kbId, dto);
}

@Permissions('knowledge:edit')
@OperationLog('鐭ヨ瘑搴?, '鏇存柊鍒囩墖')
@Patch('updateChunk/:kbId')
updateChunk(@Param('kbId') kbId: string, @Body() dto: UpdateChunkDto) {
  return this.knowledgeService.updateChunk(kbId, dto);
}

@Permissions('knowledge:delete')
@OperationLog('鐭ヨ瘑搴?, '鍒犻櫎鍒囩墖')
@Delete('deleteChunks/:kbId')
deleteChunks(@Param('kbId') kbId: string, @Body() dto: DeleteChunksDto) {
  return this.knowledgeService.deleteChunks(kbId, dto);
}
```

- [ ] **Step 3: 缂栬瘧 + 鎻愪氦**

```bash
cd ai-admin/backend
npx tsc --noEmit --pretty
git add ai-admin/backend/src/knowledge/ragflow/ragflow-chunk.service.ts ai-admin/backend/src/knowledge/
git commit -m "feat: add chunk management (list, update, delete, search)"
```

---

### Task 22: 鏅鸿兘浣撶鐞嗭紙Agent API锛?
**Files:**
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-agent.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.module.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.controller.ts`
- Modify: `ai-admin/backend/src/knowledge/dto/knowledge.dto.ts`

- [ ] **Step 1: 鍒涘缓 RagflowAgentService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-agent.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagflowBaseService } from './ragflow-base.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowAgentService extends RagflowBaseService {
  protected readonly log = new AppLoggerService('RagflowAgent');
  constructor(config: ConfigService) { super(config); }

  // A1 鈥?鍒涘缓鏅鸿兘浣撱€俁AGFlow Agent 闇€瑕?title + dsl锛涚涓€鐗?DSL 鏉ヨ嚜妯℃澘鎴栨渶灏?DSL锛屼笉鍦ㄦ垜浠郴缁熼噷鎵嬪啓鐢诲竷銆?  async createAgent(data: { title: string; description?: string; dsl: Record<string, unknown> }) {
    return this.request<{ id: string }>('/agents', { method: 'POST', body: data });
  }

  // A2 鈥?鏅鸿兘浣撳垪琛?  async listAgents(params?: { page?: number; page_size?: number }) {
    return this.request<Array<Record<string, unknown>>>('/agents', { params });
  }

  // A3 鈥?鏅鸿兘浣撹鎯?  async getAgentDetail(agentId: string) {
    return this.request<Record<string, unknown>>(`/agents/${agentId}`);
  }

  // A4 鈥?鏇存柊鏅鸿兘浣?  async updateAgent(agentId: string, data: Record<string, unknown>) {
    return this.request(`/agents/${agentId}`, { method: 'PUT', body: data });
  }

  // A5 鈥?鍒犻櫎鏅鸿兘浣?  async deleteAgent(agentId: string) {
    return this.request(`/agents/${agentId}`, { method: 'DELETE' });
  }

  // A6 鈥?妯℃澘鍒楄〃
  async listTemplates() {
    return this.request<Array<Record<string, unknown>>>('/agents/templates');
  }

  // A7 鈥?鍒涘缓 Agent 浼氳瘽
  async createAgentSession(agentId: string, data?: { name?: string }) {
    return this.request<{ id: string }>(`/agents/${agentId}/sessions`, { method: 'POST', body: data ?? {} });
  }

  // A8 鈥?Agent 浼氳瘽鍒楄〃
  async listAgentSessions(agentId: string, params?: { page?: number; page_size?: number }) {
    return this.request<Array<Record<string, unknown>>>(`/agents/${agentId}/sessions`, { params });
  }

  // A9 鈥?Agent 鎵ц锛圫SE 娴佸紡锛?  async agentCompletions(agentId: string, sessionId: string, question: string): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseUrl}/api/v1/agents/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST', headers,
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          query: question,
          stream: true,
          'openai-compatible': false,
        }),
      });
      return res.body;
    } catch (err) {
      this.log.error('Agent completions stream failed', err);
      return null;
    }
  }
}
```

- [ ] **Step 2: 娉ㄥ唽 + Service 濮旀墭 + Controller + DTO + 鎻愪氦**

姝ラ姒傝锛氫笌 Task 21 妯″紡鐩稿悓锛屾敞鍐?module銆佸湪 knowledge.service.ts 涓坊鍔犲鎵樻柟娉曘€佸湪 knowledge.controller.ts 娣诲姞绔偣銆佸湪 knowledge.dto.ts 娣诲姞 Agent 鐩稿叧 DTO銆侫gent DSL 鐢诲竷缂栬緫涓嶅湪鏈樁娈靛鍒伙紱鏈樁娈垫敮鎸佹ā鏉垮垱寤恒€佸垪琛ㄣ€佽鎯呫€佹洿鏂板熀纭€淇℃伅銆佸垹闄ゃ€佷細璇濄€丼SE 杩愯銆佽烦杞?RAGFlow 鍘熺敓 Agent 缂栬緫椤点€?
```bash
git add ai-admin/backend/src/knowledge/ragflow/ragflow-agent.service.ts ai-admin/backend/src/knowledge/
git commit -m "feat: add agent management (list, CRUD, sessions, SSE)"
```

---

### Task 23: LLM 閰嶇疆绠＄悊

RAGFlow LLM 閰嶇疆涓嶆槸 `/api/v1` REST 璧勬簮锛岃€屾槸 web API锛歚/v1/llm/*`銆傚洜姝?`RagflowLlmService` 涓嶈兘缁ф壙鍙細鎷?`/api/v1` 鐨勬櫘閫?`request()`锛屽繀椤讳娇鐢?`requestWeb()` 鎴栬 `RagflowBaseService` 鏀寔 `apiPrefix: '/v1' | '/api/v1'`銆傝繖閮ㄥ垎娑夊強妯″瀷 API Key锛屾棩蹇楀繀椤昏劚鏁忥紝鍓嶇涔熶笉寰楀洖鏄惧畬鏁?key銆?
**Files:**
- Create: `ai-admin/backend/src/knowledge/ragflow/ragflow-llm.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.module.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.service.ts`
- Modify: `ai-admin/backend/src/knowledge/knowledge.controller.ts`

- [ ] **Step 1: 鍒涘缓 RagflowLlmService**

```typescript
// ai-admin/backend/src/knowledge/ragflow/ragflow-llm.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagflowBaseService } from './ragflow-base.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RagflowLlmService extends RagflowBaseService {
  protected readonly log = new AppLoggerService('RagflowLlm');
  constructor(config: ConfigService) { super(config); }

  // L1 鈥?璁剧疆 API Key
  async setApiKey(factory: string, apiKey: string) {
    return this.requestWeb('/v1/llm/set_api_key', { method: 'POST', body: { factory, api_key: apiKey } });
  }

  // L2 鈥?娣诲姞 LLM 妯″瀷
  async addLlm(data: { model_name: string; model_type: string; factory: string; api_base?: string; api_key?: string }) {
    return this.requestWeb('/v1/llm/add_llm', { method: 'POST', body: data });
  }

  // L3 鈥?鑾峰彇宸查厤缃殑 LLM 鍒楄〃
  async listMyLlms() {
    return this.requestWeb<Array<Record<string, unknown>>>('/v1/llm/my_llms');
  }

  // L4 鈥?璁剧疆褰撳墠鐢ㄦ埛/绉熸埛榛樿妯″瀷銆傝繖涓帴鍙ｅ睘浜?/api/v1銆?  async updateDefaultModels(data: Record<string, unknown>) {
    return this.request('/users/me/models', { method: 'PATCH', body: data });
  }
}
```

- [ ] **Step 2: 娉ㄥ唽 + 濮旀墭 + Controller + 鎻愪氦**

```bash
git add ai-admin/backend/src/knowledge/ragflow/ragflow-llm.service.ts ai-admin/backend/src/knowledge/
git commit -m "feat: add LLM config management"
```

---

### Task 24: Phase 3 鍓嶇椤甸潰

**Files:**
- Create: `ai-admin/frontend/src/views/knowledge/chunk/index.vue`
- Create: `ai-admin/frontend/src/views/knowledge/agent/index.vue`
- Create: `ai-admin/frontend/src/views/knowledge/llm-config/index.vue`

- [ ] **Step 1: 鍒囩墖绠＄悊椤甸潰锛堝彧璇诲垪琛?+ 鍒囩墖绾у埆妫€绱級**

绠€娲佸垪琛ㄩ〉锛屼笌鐜版湁鐨勭煡璇嗗簱鍒楄〃椤电粨鏋勭浉浼硷紝灞曠ず鍒囩墖鍐呭銆佺浉浼煎害銆佸叧閿瘝绛夈€?
- [ ] **Step 2: Agent 绠＄悊椤甸潰锛堝垪琛?+ 鍚敤/绂佺敤锛?*

Agent 鍒楄〃椤碉紝琛屾搷浣滃寘鎷煡鐪?DSL銆佸惎鐢?绂佺敤銆佸垹闄ゃ€侱SL 鐢诲竷缂栬緫鍦?RAGFlow 鍘熺敓 UI 涓搷浣溿€?
- [ ] **Step 3: LLM 閰嶇疆椤甸潰锛堟煡鐪嬪凡閰嶇疆妯″瀷锛?*

绠€鏄撳垪琛ㄩ〉锛屽睍绀哄凡閰嶇疆鐨?LLM 鍘傚晢鍜屾ā鍨嬪垪琛ㄣ€?
- [ ] **Step 4: 鎻愪氦**

```bash
git add ai-admin/frontend/src/views/knowledge/chunk/ ai-admin/frontend/src/views/knowledge/agent/ ai-admin/frontend/src/views/knowledge/llm-config/
git commit -m "feat: add Phase 3 frontend pages for chunk, agent, LLM config"
```

---

### Task 25: Phase 3 璺敱 + i18n + 绉嶅瓙鏁版嵁

**Files:**
- Modify: `ai-admin/frontend/src/router/elegant/imports.ts`
- Modify: `ai-admin/frontend/src/router/elegant/routes.ts`
- Modify: `ai-admin/frontend/src/router/elegant/transform.ts`
- Modify: `ai-admin/frontend/src/locales/settings/zh-CN.json`
- Modify: `ai-admin/frontend/src/locales/settings/en-US.json`
- Modify: `ai-admin/backend/prisma/seed.ts`

- [ ] **Step 1: 璺敱娉ㄥ唽**

```typescript
// imports.ts
  "knowledge_chunk": () => import("@/views/knowledge/chunk/index.vue"),
  "knowledge_agent": () => import("@/views/knowledge/agent/index.vue"),
  "knowledge_llm-config": () => import("@/views/knowledge/llm-config/index.vue"),

// routes.ts 鈥?鍦?knowledge 鐩綍 children 涓坊鍔?  {
    name: 'knowledge_chunk',
    path: '/knowledge/chunk',
    component: 'view.knowledge_chunk',
    meta: { title: 'knowledge_chunk', i18nKey: 'route.knowledge_chunk' }
  },
  {
    name: 'knowledge_agent',
    path: '/knowledge/agent',
    component: 'view.knowledge_agent',
    meta: { title: 'knowledge_agent', i18nKey: 'route.knowledge_agent' }
  },
  {
    name: 'knowledge_llm-config',
    path: '/knowledge/llm-config',
    component: 'view.knowledge_llm-config',
    meta: { title: 'knowledge_llm-config', i18nKey: 'route.knowledge_llm-config' }
  },

// transform.ts
  "knowledge_chunk": "/knowledge/chunk",
  "knowledge_agent": "/knowledge/agent",
  "knowledge_llm-config": "/knowledge/llm-config",
```

- [ ] **Step 2: i18n**

```json
// zh-CN.json
    "knowledge_chunk": "鍒囩墖绠＄悊",
    "knowledge_agent": "鏅鸿兘浣?,
    "knowledge_llm-config": "LLM 閰嶇疆"

// en-US.json
    "knowledge_chunk": "Chunks",
    "knowledge_agent": "Agents",
    "knowledge_llm-config": "LLM Config"
```

- [ ] **Step 3: 绉嶅瓙鏁版嵁**

鍦?`knowledgeMenu` 瀛愯彍鍗曚腑娣诲姞 Phase 3 椤甸潰銆傜敱浜?Phase 3 鍔熻兘澶嶆潅锛屾寜閽潈闄愭殏涓嶆坊鍔犵瀛愶紝寰呭疄闄呭疄鐜版椂鎸夐渶娣诲姞銆?
```typescript
  await prisma.menu.create({
    data: {
      parentId: knowledgeMenu.id, type: 2, name: 'knowledge_chunk',
      path: '/knowledge/chunk', component: 'layout.base$view.knowledge_chunk',
      icon: 'carbon:data-1', sort: 3, status: 1,
    },
  });
  await prisma.menu.create({
    data: {
      parentId: knowledgeMenu.id, type: 2, name: 'knowledge_agent',
      path: '/knowledge/agent', component: 'layout.base$view.knowledge_agent',
      icon: 'carbon:bot', sort: 4, status: 1,
    },
  });
  await prisma.menu.create({
    data: {
      parentId: knowledgeMenu.id, type: 2, name: 'knowledge_llm-config',
      path: '/knowledge/llm-config', component: 'layout.base$view.knowledge_llm-config',
      icon: 'carbon:settings', sort: 5, status: 1,
    },
  });
```

- [ ] **Step 4: 楠岃瘉缂栬瘧 + 鎻愪氦**

```bash
cd ai-admin/frontend && npx tsc --noEmit --pretty
cd ../backend && npx tsc --noEmit --pretty
git add ai-admin/frontend/src/router/elegant/ ai-admin/frontend/src/locales/ ai-admin/backend/prisma/seed.ts
git commit -m "feat: add Phase 3 routes, i18n and seed data"
```


---

## Phase 4 鈥?RAGFlow 楂橀樁鑳藉姏琛ラ綈

杩欎竴闃舵鐢ㄤ簬婊¤冻鈥滃敖鍙兘鍏ㄢ€濈殑鐩爣锛屼笉鍐嶅彧鍋氱煡璇嗗簱鍩虹鑳藉姏锛岃€屾槸鎶?RAGFlow 鏆撮湶鐨勪富瑕佺鐞嗛潰閫愭绾冲叆浼佷笟闂ㄦ埛銆侾hase 4 涓嶅簲璇ラ樆濉?Phase 1-3 涓婄嚎锛屼絾蹇呴』鍦?spec 涓崰浣嶏紝鍚﹀垯鍚庣画浼氳浠ヤ负褰撳墠璁″垝宸茬粡瑕嗙洊 RAGFlow 鍏ㄩ儴鑳藉姏銆?
### Task 26: 鏍囩銆佸厓鏁版嵁涓庢绱㈠寮?
**RAGFlow 瀵瑰簲鑳藉姏锛?*
- `GET /api/v1/datasets/tags/aggregation`
- `GET /api/v1/datasets/{dataset_id}/tags`
- `PUT /api/v1/datasets/{dataset_id}/tags`
- `DELETE /api/v1/datasets/{dataset_id}/tags`
- `GET /api/v1/datasets/metadata/flattened`
- `GET /api/v1/datasets/{dataset_id}/metadata/config`
- `PUT /api/v1/datasets/{dataset_id}/metadata/config`
- `GET /api/v1/datasets/{dataset_id}/metadata/summary`
- `POST /api/v1/datasets/{dataset_id}/metadata/update`

**搴斿仛椤甸潰锛?*
- 鐭ヨ瘑搴撴爣绛剧鐞?- 鍏冩暟鎹瓧娈甸厤缃?- 鏂囨。鍏冩暟鎹壒閲忕淮鎶?- 妫€绱㈣繃婊ゆ潯浠堕厤缃?
**涓轰粈涔堣鍋氾細** 鏀垮簻鏂囦欢鐭ヨ瘑搴撲細澶ч噺渚濊禆鍙戞枃鏈哄叧銆佹枃鍙枫€佸彂甯冩棩鏈熴€佷富棰樺垎绫汇€佹晥鍔涚姸鎬佺瓑缁撴瀯鍖栧瓧娈点€傚彧闈犲悜閲忔绱細瀵艰嚧鏀跨瓥鏌ヨ缁撴灉涓嶇ǔ瀹氾紝鍏冩暟鎹繃婊ゆ槸浼佷笟绾?RAG 鐨勫繀瑕佽兘鍔涖€?
### Task 27: GraphRAG銆丷APTOR銆佺储寮曚笌 Embedding 杩愮淮

**RAGFlow 瀵瑰簲鑳藉姏锛?*
- `POST /api/v1/datasets/{dataset_id}/run_graphrag`
- `GET /api/v1/datasets/{dataset_id}/trace_graphrag`
- `DELETE /api/v1/datasets/{dataset_id}/knowledge_graph`
- `POST /api/v1/datasets/{dataset_id}/run_raptor`
- `GET /api/v1/datasets/{dataset_id}/trace_raptor`
- `POST /api/v1/datasets/{dataset_id}/index`
- `GET /api/v1/datasets/{dataset_id}/index`
- `DELETE /api/v1/datasets/{dataset_id}/index`
- `POST /api/v1/datasets/{dataset_id}/embedding`
- `POST /api/v1/datasets/{dataset_id}/embedding/check`
- `GET /api/v1/datasets/{dataset_id}/ingestions`
- `GET /api/v1/datasets/{dataset_id}/ingestions/{log_id}`

**搴斿仛椤甸潰锛?*
- 鐭ヨ瘑鍥捐氨鏋勫缓/娓呯悊/鐘舵€佽拷韪?- RAPTOR 鏋勫缓/鐘舵€佽拷韪?- 绱㈠紩鐘舵€併€侀噸寤恒€佸垹闄?- Embedding 妯″瀷鍙樻洿涓庡吋瀹规€ф鏌?- 瑙ｆ瀽/鍏ュ簱鏃ュ織鏌ョ湅

**涓轰粈涔堣鍋氾細** 1 涓囦唤鏀垮簻鏂囦欢鍚庣画浼氶亣鍒伴暱鏂囨。銆佸灞傜骇鏀跨瓥銆佽法鏂囦欢寮曠敤鍜岄棶绛旈摼璺彲瑙ｉ噴鎬ч棶棰樸€侴raphRAG/RAPTOR 鍜?ingestion logs 鏄川閲忚皟浼樺叆鍙ｏ紝涓嶅簲姘歌繙渚濊禆 RAGFlow 鍘熺敓鍚庡彴銆?
### Task 28: 澶栭儴鏁版嵁婧愯繛鎺ュ櫒

**RAGFlow 瀵瑰簲鑳藉姏锛?*
- `POST /api/v1/connectors`
- `GET /api/v1/connectors`
- `GET /api/v1/connectors/{connector_id}`
- `GET /api/v1/connectors/{connector_id}/logs`
- `POST /api/v1/connectors/{connector_id}/rebuild`
- `DELETE /api/v1/connectors/{connector_id}`
- `POST /api/v1/connectors/{connector_id}/test`
- OAuth callback 绫绘帴鍙ｄ繚鐣欑粰 RAGFlow 鍘熺敓娴佺▼澶勭悊

**搴斿仛椤甸潰锛?*
- 杩炴帴鍣ㄥ垪琛?- 杩炴帴鍣ㄥ悓姝ョ姸鎬佸拰鏃ュ織
- 閲嶅缓绱㈠紩
- 杩炴帴娴嬭瘯
- 鍘熺敓 OAuth 閰嶇疆璺宠浆

**涓轰粈涔堣鍋氾細** 浼佷笟鐭ヨ瘑搴撳悗缁笉浼氬彧鏈夋湰鍦颁笂浼狅紝杩樹細鎺ュ叆 GitHub銆丆onfluence銆丟oogle Drive銆丯otion 绛夋暟鎹簮銆傞棬鎴烽渶瑕佺粺涓€鐪嬪悓姝ョ姸鎬侊紝浣?OAuth 缁嗚妭鐢?RAGFlow 鍘熺敓娴佺▼鎵挎帴鏇寸ǔ銆?
### Task 29: Memory銆丮CP銆丼earch App 涓庣郴缁熻兘鍔?
**RAGFlow 瀵瑰簲鑳藉姏锛?*
- Memory: `/api/v1/memories`, `/api/v1/messages`, `/api/v1/messages/search`
- MCP: `/api/v1/mcp/servers`
- Search App: `/api/v1/searches`, `/api/v1/searches/{search_id}/completions`
- System: `/api/v1/system/status`, `/api/v1/system/healthz`, `/api/v1/system/tokens`, `/api/v1/system/stats`

**搴斿仛椤甸潰锛?*
- Memory 绠＄悊涓庢秷鎭绱?- MCP Server 绠＄悊涓庢祴璇?- Search App 绠＄悊涓庤繍琛?- RAGFlow 鍋ュ悍鐘舵€併€佺増鏈€乀oken 绠＄悊銆佺粺璁＄湅鏉?
**涓轰粈涔堣鍋氾細** 濡傛灉骞冲彴瀹氫綅鏄?AI 涓彴锛孯AGFlow 涓嶅彧鏄煡璇嗗簱锛岃繕鎵挎媴 Agent 宸ュ叿銆侀暱鏈熻蹇嗐€佹悳绱㈠簲鐢ㄣ€佺郴缁熻繍缁磋兘鍔涖€侾hase 4 鎶婅繖浜涗綔涓衡€滈珮绾ц繍缁?楂樼骇閰嶇疆鈥濈撼鍏ワ紝涓嶅奖鍝嶆櫘閫氱敤鎴风殑涓€绾夸娇鐢ㄣ€?
---

## 鏉冮檺鏍囪瘑姹囨€?
| 鏉冮檺鏍囪瘑 | 璇存槑 | 闃舵 |
|---------|------|------|
| `knowledge:add` | 鏂板鐭ヨ瘑搴?/ 涓婁紶鏂囨。 / 瑙ｆ瀽鏂囨。 | Phase 1 |
| `knowledge:edit` | 缂栬緫鐭ヨ瘑搴?/ 鏇存柊鏂囨。鍏冩暟鎹?| Phase 1 |
| `knowledge:delete` | 鍒犻櫎鐭ヨ瘑搴?/ 鍒犻櫎鏂囨。 | Phase 1 |
| `knowledge:search` | 璇箟妫€绱?/ 璺ㄥ簱妫€绱?/ 鏂囦欢棰勮涓嬭浇 | Phase 1+2 |
| `knowledge:chat` | 瀵硅瘽鍔╂墜绠＄悊锛堝垱寤?缂栬緫/鍒犻櫎/浼氳瘽绠＄悊锛?| Phase 2 |
| `knowledge:chunk` | 鍒囩墖鏌ョ湅 / 淇敼 / 鍒犻櫎 / 鍚仠鐢?| Phase 3 |
| `knowledge:agent` | Agent 鍒楄〃 / 妯℃澘 / 浼氳瘽 / 杩愯 / 鍒犻櫎 | Phase 3 |
| `knowledge:llm` | LLM 閰嶇疆 / 榛樿妯″瀷 / API Key 绠＄悊 | Phase 3 |
| `knowledge:advanced` | 鏍囩 / 鍏冩暟鎹?/ GraphRAG / RAPTOR / 绱㈠紩杩愮淮 | Phase 4 |
| `knowledge:connector` | 澶栭儴鏁版嵁婧愯繛鎺ュ櫒绠＄悊 | Phase 4 |
| `knowledge:ops` | RAGFlow 鍋ュ悍鐘舵€?/ Token / 缁熻 / MCP / Memory | Phase 4 |

## 鏁版嵁绾ф潈闄愯鏄?
鐭ヨ瘑搴撻€氳繃 `KnowledgeBaseRole` 琛ㄥ疄鐜拌鑹茬骇鍒殑鏁版嵁闅旂锛?
- **鍒涘缓/缂栬緫鏃?*锛氭寚瀹氬摢浜涜鑹插彲浠ヨ闂鐭ヨ瘑搴擄紙`roleIds` 瀛楁锛?- **鏌ヨ鏃?*锛氳嚜鍔ㄦ牴鎹綋鍓嶇敤鎴风殑瑙掕壊杩囨护鍙鐨勭煡璇嗗簱
- **绠＄悊鍛橈紙admin 瑙掕壊锛?*锛歴eed 涓嚜鍔ㄥ叧鑱旀墍鏈夌煡璇嗗簱锛屽厤闄よ繃婊?- **鏃犺鑹茬殑鐢ㄦ埛**锛氱湅涓嶅埌浠讳綍鐭ヨ瘑搴?- **瀛樺偍灞?*锛歅risma `KnowledgeBaseRole` 妯″瀷锛宍@@id([kbId, roleId])` 澶嶅悎涓婚敭锛宍onDelete: Cascade`

---

## 鐭ヨ瘑搴撶姸鎬佺爜

| status | 鍚箟 |
|--------|------|
| 1 | 瑙ｆ瀽涓紙鏈夋枃妗ｆ鍦ㄨВ鏋愶級 |
| 2 | 灏辩华锛堟棤鏂囨。鎴栬В鏋愬畬鎴愶級 |
| 3 | 澶辫触锛堜繚鐣欙紝鏆傛湭浣跨敤锛?|
