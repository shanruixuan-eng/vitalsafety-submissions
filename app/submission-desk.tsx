"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ChevronDown, ChevronRight,
  Circle, Factory, FileText, FolderOpen, Images, Info, ListChecks,
  LockKeyhole, Plus, RefreshCw, Send, ShieldCheck, UploadCloud, X,
} from "lucide-react";
import {
  basics, categories, checkDraft, formatTime, getFields, getProductFields, getStoryFields, imagePermissions,
  IMAGE_TYPES, MAX_CAPTION, MAX_IMAGES, MAX_PRODUCTS, MAX_SOURCE, MAX_TOTAL_BYTES, noPhotosField,
  parseProducts, PRODUCTS_LABEL, verifyImage, type Category, type Field, type Picture, type Receipt, type SavedSubmission,
} from "@/lib/submissions";
import { SubmissionPolicy } from "./submission-policy";

type DraftPicture = Picture & { id: string; file: File; url: string };
type Draft = { fields: Record<string, string>; images: DraftPicture[]; confirmed: boolean };
type Stage = "edit" | "review" | "success";
const blankDraft = (): Draft => ({ fields: { products: "[{}]" }, images: [], confirmed: false });
const sections = ["基本信息", "稿件内容", "图片资料", "供稿确认"];
const sectionIds = ["basics", "story", "images", "confirmation"];

function Guidelines() {
  return <section className="side-card guidelines" aria-labelledby="guidelines-title">
    <div className="side-heading"><span className="small-icon"><ShieldCheck size={19} /></span><h3 id="guidelines-title">公众号供稿原则</h3></div>
    <ul className="rule-list">
      <li><Check size={15} /><span>产品型号、检测介质和用途请对照真实资料核实。</span></li>
      <li><Check size={15} /><span>实名资料填写在内部核实区。请说明保密约定，避免提交敏感方案、系统架构或点位配置。</span></li>
      <li><Check size={15} /><span>请标注图片来源及对外使用权限，并处理画面中的敏感信息。</span></li>
    </ul>
  </section>;
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return <section id={id} className="form-section" aria-labelledby={id + "-title"}>
    <h3 id={id + "-title"}>{title}</h3>
    {description && <p className="section-intro">{description}</p>}
    {children}
  </section>;
}

function FieldControl({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (value: string) => void }) {
  const id = "field-" + field.key;
  const props = {
    id, value, required: field.required,
    "aria-invalid": !!error,
    "aria-describedby": [field.hint && id + "-hint", error && id + "-error"].filter(Boolean).join(" ") || undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value),
  };
  const textProps = { ...props, placeholder: field.placeholder, maxLength: field.max };
  return <div className="field">
    <label htmlFor={id}>{field.label} {field.required ? <span className="required">*</span> : <span className="optional">选填</span>}</label>
    {field.options ? <select {...props}><option value="">{field.placeholder}</option>
      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select> : field.multiline ? <textarea {...textProps} rows={field.required ? 3 : 2} /> : <input {...textProps} type="text" />}
    {(field.hint || field.multiline) && <div className="field-support">
      {field.hint && <span id={id + "-hint"}>{field.hint}</span>}
      {field.multiline && <span className="counter">{value.length} / {field.max}</span>}
    </div>}
    {error && <p id={id + "-error"} className="field-error">{error}</p>}
  </div>;
}

function Details({ category, fields }: { category: Category; fields: Record<string, string> }) {
  const info = categories[category];
  const products = parseProducts(fields.products);
  const legacyPractice = { key: "practice", label: "通用做法与经验", multiline: true };
  const fieldList = [...basics, ...info.beforeProducts, ...info.afterProducts, ...info.internal, noPhotosField, legacyPractice];
  return <>
    <dl className="detail-fields">
      {fieldList.filter((field) => fields[field.key]?.trim()).map((field) =>
        <div key={field.key} className={field.multiline ? "detail-wide" : ""}>
          <dt>{field.label}{info.internal.some(({ key }) => key === field.key) ? "（仅供内部核实）" : ""}</dt>
          <dd>{fields[field.key].trim()}</dd>
        </div>
      )}
    </dl>
    {!!products.length && <section className="product-overview">
      <h3>{PRODUCTS_LABEL}</h3>
      {products.map((product, index) => <dl className="detail-fields product-card" key={index}>
        {getProductFields(category).map((field) => <div key={field.key} className={field.multiline ? "detail-wide" : ""}>
          <dt>{field.label}</dt><dd>{product[field.key]?.trim()}</dd>
        </div>)}
      </dl>)}
    </section>}
  </>;
}

function PictureCaption({ picture }: { picture: Picture }) {
  return <figcaption>{picture.caption.trim()}
    {picture.source && <span className="picture-meta">来源：{picture.source.trim()}</span>}
    {picture.permission && <span className="picture-meta">权限：{picture.permission}</span>}
  </figcaption>;
}

function Received({ selectedId, onNew }: { selectedId: string | null; onNew: () => void }) {
  const [items, setItems] = useState<SavedSubmission[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(selectedId);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/submissions?page=${page}`, { signal: controller.signal })
      .then(async (result) => {
        const data = await result.json() as { message?: string; submissions?: SavedSubmission[]; hasMore?: boolean };
        if (!result.ok || !data.submissions) throw new Error(data.message || "暂时无法读取稿件。");
        setItems(data.submissions);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((problem) => {
        if (!controller.signal.aborted) setError(problem.message || "暂时无法读取稿件。");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, reload]);

  function load(next: number) {
    setError("");
    setLoading(true);
    setPage(next);
    setReload((value) => value + 1);
  }

  return <section className="inbox">
    <div className="inbox-heading">
      <div><h1>已收稿件</h1><p>查看稿件内容和随附图片。</p></div>
      <button type="button" className="button primary" onClick={onNew}><ArrowLeft size={18} />返回投稿入口</button>
    </div>
    <div className="panel inbox-panel">
      {loading && <div className="empty-state" role="status"><RefreshCw size={27} /><p>正在读取稿件…</p></div>}
      {!loading && error && <div className="empty-state" role="alert"><Info size={27} /><p>{error}</p><button type="button" className="button secondary" onClick={() => load(page)}>重新读取</button></div>}
      {!loading && !error && !items.length && <div className="empty-state"><FolderOpen size={34} /><h2>还没有收到稿件</h2><p>提交成功后，稿件和图片会出现在这里。</p><button type="button" className="button secondary" onClick={onNew}>前往投稿</button></div>}
      {!loading && !error && items.map((item) =>
        <article key={item.id} className="received-item">
          <button type="button" className="received-row" onClick={() => setOpen(open === item.id ? null : item.id)} aria-expanded={open === item.id}>
            <span className="small-icon"><FileText size={19} /></span>
            <span className="received-name"><strong>{item.title}</strong><span>{categories[item.category].title} · {formatTime.format(new Date(item.createdAt))}</span></span>
            <ChevronDown size={20} className={open === item.id ? "rotated" : ""} />
          </button>
          {open === item.id && <div className="received-detail">
            <Details category={item.category} fields={item.fields} />
            <h3>随附图片</h3>
            <div className="review-photos">
              {item.images.map((photo, index) => {
                const url = `/api/submissions/${item.id}/${index}`;
                return <figure key={url}><a href={url} target="_blank" rel="noreferrer"><img src={url} alt={photo.caption} loading="lazy" /></a><PictureCaption picture={photo} /></figure>;
              })}
            </div>
            <p className="record-id">稿件编号 {item.id}</p>
          </div>}
        </article>
      )}
      {!loading && !error && (page > 1 || hasMore) && <nav className="pagination" aria-label="稿件翻页">
        <button type="button" className="button secondary" disabled={page <= 1} onClick={() => load(page - 1)}>上一页</button>
        <span>第 {page} 页</span>
        <button type="button" className="button secondary" disabled={!hasMore} onClick={() => load(page + 1)}>下一页</button>
      </nav>}
    </div>
  </section>;
}

export function SubmissionDesk() {
  const [category, setCategory] = useState<Category>("industry");
  const [inbox, setInbox] = useState(false);
  const [stage, setStage] = useState<Stage>("edit");
  const [drafts, setDrafts] = useState<Record<Category, Draft>>(() => ({ industry: blankDraft(), project: blankDraft() }));
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [uploadIssue, setUploadIssue] = useState("");
  const [serverIssue, setServerIssue] = useState("");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pendingId = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const draft = drafts[category];
  const info = categories[category];
  const products = parseProducts(draft.fields.products);
  const errors = checkDraft(category, draft.fields, draft.images, draft.confirmed);
  const visibleErrors = { ...serverErrors, ...errors };
  const completed = [
    basics.every(({ key }) => !errors[key]),
    getStoryFields(category).every(({ key }) => !errors[key]) &&
      !Object.keys(errors).some((key) => key === "products" || key.startsWith("product-")),
    !Object.keys(visibleErrors).some((key) =>
      key === "images" || key === "noPhotos" || /^(caption|image|source|permission)-/.test(key)),
    !errors.confirmed,
  ];
  const completedCount = completed.filter(Boolean).length;
  const errorList = Object.entries(visibleErrors);
  const showError = (key: string) => checked || touched[key] ? visibleErrors[key] : undefined;

  useEffect(() => {
    const readHash = () => {
      const value = window.location.hash.slice(1);
      setInbox(value === "received");
      if (value === "project" || value === "industry") setCategory(value);
      setStage("edit");
      setChecked(false);
      setTouched({});
      setServerIssue("");
      setServerErrors({});
      setUploadIssue("");
      pendingId.current = null;
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  function goToForm() {
    requestAnimationFrame(() => document.getElementById("form-heading")?.focus());
  }

  function navigate(target: Category | "received") {
    window.history.pushState(null, "", "#" + target);
    setInbox(target === "received");
    if (target === "received") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCategory(target);
    setStage("edit");
    setChecked(false);
    setTouched({});
    setServerErrors({});
    setServerIssue("");
    setUploadIssue("");
    pendingId.current = null;
  }

  function revise(update: (current: Draft) => Draft) {
    setDrafts((previous) => ({ ...previous, [category]: update(previous[category]) }));
    setServerErrors({});
    setServerIssue("");
    pendingId.current = null;
  }

  function renderField(field: Field) {
    return <div key={field.key} onBlur={() => setTouched((current) => ({ ...current, [field.key]: true }))}>
      <FieldControl field={field} value={draft.fields[field.key] ?? ""} error={showError(field.key)}
        onChange={(value) => revise((current) => ({ ...current, fields: { ...current.fields, [field.key]: value } }))} />
    </div>;
  }

  async function addFiles(files: File[]) {
    if (!files.length || loadingImages) return;
    setLoadingImages(true);
    const pictures: DraftPicture[] = [];
    const rejected: string[] = [];
    let total = draft.images.reduce((sum, image) => sum + image.size, 0);
    for (const file of files) {
      const invalid = verifyImage(file);
      if (invalid) { rejected.push(`${file.name}：${invalid}`); continue; }
      if (draft.images.length + pictures.length >= MAX_IMAGES) { rejected.push("最多上传 5 张图片。"); break; }
      if (total + file.size > MAX_TOTAL_BYTES) { rejected.push(`${file.name}：全部图片合计须在 24 MB 以内。`); continue; }
      const url = URL.createObjectURL(file);
      const test = new window.Image();
      test.src = url;
      try {
        await test.decode();
        pictures.push({ id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, caption: "", file, url });
        total += file.size;
      } catch {
        URL.revokeObjectURL(url);
        rejected.push(`${file.name}：图片打不开，请重新选择。`);
      }
    }
    if (pictures.length) revise((current) => ({
      ...current, fields: { ...current.fields, noPhotos: "" }, images: [...current.images, ...pictures],
    }));
    setUploadIssue(rejected.join(" "));
    setLoadingImages(false);
  }

  function removePicture(id: string) {
    const image = draft.images.find((file) => file.id === id);
    if (image) URL.revokeObjectURL(image.url);
    revise((current) => ({ ...current, images: current.images.filter((file) => file.id !== id) }));
    setUploadIssue("");
  }

  function updateProducts(next: Record<string, string>[]) {
    revise((current) => ({ ...current, fields: { ...current.fields, products: JSON.stringify(next) } }));
  }

  function updatePicture(id: string, key: "caption" | "source" | "permission", value: string) {
    revise((current) => ({
      ...current, images: current.images.map((photo) => photo.id === id ? { ...photo, [key]: value } : photo),
    }));
  }

  function jumpTo(key: string) {
    const id = key.startsWith("image-") ? "photo-" + key.slice(6) : /^(caption|source|permission)-/.test(key) ? key
      : key === "images" ? "upload-zone" : key === "confirmed" ? "confirmed" : key === "products" ? "add-product" : "field-" + key;
    const target = document.getElementById(id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadingImages) return;
    setChecked(true);
    if (errorList.length) {
      requestAnimationFrame(() => document.getElementById("missing-items")?.focus());
      return;
    }
    setStage("review");
    goToForm();
  }

  async function send() {
    if (sending) return;
    setServerIssue("");
    setSending(true);
    pendingId.current ??= crypto.randomUUID();
    const form = new FormData();
    form.set("id", pendingId.current);
    form.set("category", category);
    form.set("confirmed", draft.confirmed ? "yes" : "");
    for (const { key } of getFields(category)) form.set(key, draft.fields[key] ?? "");
    form.set("products", draft.fields.products ?? "");
    if (!draft.images.length) form.set("noPhotos", draft.fields.noPhotos ?? "");
    for (const file of draft.images) {
      form.append("image", file.file);
      form.append("caption", file.caption);
      form.append("source", file.source ?? "");
      form.append("permission", file.permission ?? "");
    }
    try {
      const result = await fetch("/api/submissions", { method: "POST", body: form });
      const data = await result.json() as { message?: string; errors?: Record<string, string>; receipt?: Receipt };
      if (!result.ok) {
        if (data.errors) {
          setChecked(true);
          setServerErrors(data.errors);
          setStage("edit");
          goToForm();
        } else {
          setServerIssue(data.message || "提交暂未确认，请重试。");
        }
        return;
      }
      if (!data.receipt?.id) throw new Error("Missing receipt");
      setReceipt(data.receipt);
      draft.images.forEach(({ url }) => URL.revokeObjectURL(url));
      revise(() => blankDraft());
      setChecked(false);
      setTouched({});
      setStage("success");
      goToForm();
    } catch {
      setServerIssue("提交暂未确认。表单内容仍保留在此页，请稍后重试。");
    } finally {
      setSending(false);
    }
  }

  return <>
    <header className="site-header">
      <div className="shell header-inner">
        <button type="button" className="brand" onClick={() => { if (!sending) navigate(category); }} aria-label="惟泰安全供稿入口">
          <img src="/vitalsafety-logo.webp" alt="惟泰安全" width="113" height="43" />
          <span className="brand-divider" /><span className="brand-label">供稿收集站</span>
        </button>
        <nav className="top-nav" aria-label="站点导航">
          <button type="button" className={!inbox ? "nav-active" : ""} aria-current={!inbox ? "page" : undefined} disabled={sending} onClick={() => navigate(category)}><FileText size={17} />投稿入口</button>
          <button type="button" className={inbox ? "nav-active" : ""} aria-current={inbox ? "page" : undefined} disabled={sending} onClick={() => { setSelectedId(null); navigate("received"); }}><FolderOpen size={17} />已收稿件</button>
        </nav>
      </div>
    </header>

    <main className="shell main-shell">
      {inbox ? <Received key={selectedId ?? "all"} selectedId={selectedId} onNew={() => navigate(category)} /> : <>
        <section className="hero" aria-labelledby="site-title">
          <div className="hero-copy">
            <p className="hero-context"><span />惟泰安全 · 公众号编辑部</p>
            <h1 id="site-title">供稿收集站</h1>
            <p className="hero-description">分享行业经验与项目实践，提交可用于公众号编辑的文字与图片。</p>
            <div className="private-note"><LockKeyhole size={14} strokeWidth={2} /> 内部供稿 · 私密访问</div>
          </div>
          <img className="hero-photo" src="/vitalsafety-factory.webp" alt="惟泰安全工厂园区全景" fetchPriority="high" />
        </section>

        <SubmissionPolicy />

        <section className="categories" aria-labelledby="category-title">
          <div className="section-title"><h2 id="category-title">选择投稿板块</h2><span>请选择与稿件内容对应的板块</span></div>
          <div className="category-grid">
            {(["industry", "project"] as const).map((kind) => {
              const item = categories[kind];
              const Icon = kind === "industry" ? Factory : Building2;
              return <button type="button" key={kind} className={`category-card ${category === kind ? "selected" : ""}`}
                aria-pressed={category === kind} disabled={sending || loadingImages}
                onClick={() => { if (category !== kind || stage !== "edit") navigate(kind); goToForm(); }}>
                <span className="category-icon"><Icon size={27} strokeWidth={1.75} /></span>
                <span className="category-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
                <span className="selection-icon" aria-hidden="true">{category === kind ? <Check size={15} strokeWidth={2.7} /> : <ChevronRight size={18} />}</span>
              </button>;
            })}
          </div>
        </section>

        <div className="workspace-grid">
          <div className="panel form-panel">
            <div className="form-head">
              <div className="form-title"><span className="small-icon"><FileText size={20} /></span>
                <h2 id="form-heading" tabIndex={-1}>{stage === "edit" ? `${info.title}投稿` : stage === "review" ? "提交前预览" : "投稿回执"}</h2></div>
              <ol className="steps" aria-label="投稿进度">
                {["填写稿件", "核对预览", "提交成功"].map((label, index) => {
                  const current = ["edit", "review", "success"].indexOf(stage);
                  return <li key={label} className={current === index ? "step-current" : current > index ? "step-done" : ""} aria-current={current === index ? "step" : undefined}>
                    <span className="step-marker">{current > index ? <Check size={12} strokeWidth={2.6} /> : index + 1}</span>{label}
                  </li>;
                })}
              </ol>
            </div>

            {stage === "edit" && <form noValidate onSubmit={preview}>
              {checked && !!errorList.length && <div className="missing-items" id="missing-items" tabIndex={-1}>
                <strong><Info size={17} />请补齐以下 {errorList.length} 项</strong>
                <ul>{errorList.map(([key, message]) => <li key={key}><button type="button" onClick={() => jumpTo(key)}>{message}</button></li>)}</ul>
              </div>}
              <p className="mobile-guidance"><ShieldCheck size={17} />请核实产品资料与项目进展，标注图片来源、使用权限及已知保密限制。</p>
              <Section id="basics" title="基本信息" description="带 * 的项目为必填。">
                <div className="field-grid">{basics.map(renderField)}</div>
              </Section>
              <Section id="story" title="稿件内容" description={info.example}>
                <div className="field-stack">
                  {info.beforeProducts.map(renderField)}
                  <fieldset className="product-set">
                    <legend>{PRODUCTS_LABEL} <span className="required">*</span></legend>
                    <p className="section-intro">{category === "project" ? "请逐款填写实际涉及的产品及当前应用状态。" : "请逐款填写适用于该行业的产品，检测介质与用途须和产品资料一致。"}</p>
                    {products.map((product, index) => <div className="product-card" key={index}>
                      <div className="product-card-heading">
                        <h4>产品 {index + 1}</h4>
                        {products.length > 1 && <button type="button" className="icon-button" aria-label={`移除产品 ${index + 1}`}
                          onClick={() => updateProducts(products.filter((_, at) => at !== index))}><X size={17} /></button>}
                      </div>
                      <div className="field-stack">
                        {getProductFields(category).map((field) => {
                          const key = `product-${index}-${field.key}`;
                          return <FieldControl key={key} field={{ ...field, key }} value={product[field.key] ?? ""} error={showError(key)}
                            onChange={(value) => updateProducts(products.map((item, at) => at === index ? { ...item, [field.key]: value } : item))} />;
                        })}
                      </div>
                    </div>)}
                    {showError("products") && <p className="field-error">{showError("products")}</p>}
                    <button id="add-product" type="button" className="button secondary" disabled={products.length >= MAX_PRODUCTS}
                      onClick={() => updateProducts([...products, {}])}><Plus size={17} />添加产品</button>
                  </fieldset>
                  {info.afterProducts.map(renderField)}
                  {!!info.internal.length && <fieldset className="internal-fields">
                    <legend><LockKeyhole size={14} />仅供内部核实</legend>
                    <p className="section-intro">请按内部资料提供权限填写。如有保密或对外宣传限制，请在此说明。</p>
                    <div className="field-stack">{info.internal.map(renderField)}</div>
                  </fieldset>}
                </div>
              </Section>
              <Section id="images" title="图片资料" description={info.images}>
                <ul className="photo-rules">
                  <li>可上传最多 5 张清晰图片，支持 JPG、PNG、WebP，单张 ≤ 8 MB，合计 ≤ 24 MB。</li>
                  <li>逐张补充说明、来源和对外使用权限。请使用有权提交的素材，并处理定位信息和画面中的敏感内容。</li>
                </ul>
                <input type="file" ref={fileInput} className="visually-hidden" tabIndex={-1} multiple
                  aria-label="选择投稿图片" accept={IMAGE_TYPES.join(",")}
                  onChange={(event) => { void addFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
                <button id="upload-zone" type="button" disabled={loadingImages || draft.images.length >= MAX_IMAGES}
                  aria-invalid={!!showError("images")} className={`upload-zone ${dragging ? "dragging" : ""}`}
                  onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(Array.from(event.dataTransfer.files)); }}>
                  <UploadCloud size={26} strokeWidth={1.65} />
                  <strong>{loadingImages ? "正在检查图片…" : draft.images.length >= MAX_IMAGES ? "已上传 5 张图片" : "点击上传或拖入图片"}</strong>
                  <span>{draft.images.length} / {MAX_IMAGES} 张</span>
                </button>
                {uploadIssue && <p role="alert" className="field-error">{uploadIssue}</p>}
                {showError("images") && <p className="field-error">{showError("images")}</p>}
                {draft.images.length === 0 && <div className="no-photo-reason">
                  <p className="section-intro">如暂无图片，请填写下方说明。</p>
                  {renderField(noPhotosField)}
                </div>}
                {!!draft.images.length && <ul className="upload-list">{draft.images.map((image, index) => {
                  const captionKey = `caption-${index}`;
                  const sourceKey = `source-${index}`;
                  const permissionKey = `permission-${index}`;
                  const imageError = showError(`image-${index}`);
                  return <li key={image.id} id={"photo-" + index} tabIndex={-1}>
                    <img src={image.url} alt={image.caption || `第 ${index + 1} 张投稿图片`} />
                    <div className="picture-editor">
                      <span className="picture-name" title={image.name}>{image.name}</span>
                      <label htmlFor={captionKey}>图片 {index + 1} 说明 <span className="required">*</span></label>
                      <input id={captionKey} type="text" value={image.caption} maxLength={MAX_CAPTION} required
                        placeholder="简要说明画面内容" aria-invalid={!!showError(captionKey)}
                        onChange={(event) => updatePicture(image.id, "caption", event.target.value)} />
                      {showError(captionKey) && <p className="field-error">{showError(captionKey)}</p>}
                      <label htmlFor={sourceKey}>图片来源 <span className="required">*</span></label>
                      <input id={sourceKey} type="text" value={image.source ?? ""} maxLength={MAX_SOURCE} required
                        placeholder="如公司拍摄、客户提供或公开素材出处" aria-invalid={!!showError(sourceKey)}
                        onChange={(event) => updatePicture(image.id, "source", event.target.value)} />
                      {showError(sourceKey) && <p className="field-error">{showError(sourceKey)}</p>}
                      <label htmlFor={permissionKey}>对外使用权限 <span className="required">*</span></label>
                      <select id={permissionKey} value={image.permission ?? ""} required aria-invalid={!!showError(permissionKey)}
                        onChange={(event) => updatePicture(image.id, "permission", event.target.value)}>
                        <option value="">选择对外使用权限</option>
                        {imagePermissions.map((permission) => <option key={permission}>{permission}</option>)}
                      </select>
                      {showError(permissionKey) && <p className="field-error">{showError(permissionKey)}</p>}
                      {imageError && <p className="field-error">{imageError}</p>}
                    </div>
                    <button type="button" className="icon-button" aria-label={`移除图片 ${index + 1}`} onClick={() => removePicture(image.id)} disabled={loadingImages}><X size={18} /></button>
                  </li>;
                })}</ul>}
              </Section>
              <Section id="confirmation" title="供稿确认">
                <label className="confirmation" htmlFor="confirmed"><input id="confirmed" type="checkbox" checked={draft.confirmed}
                  aria-invalid={!!showError("confirmed")} onChange={(event) => {
                    const confirmed = event.target.checked;
                    revise((current) => ({ ...current, confirmed }));
                  }} />
                  <span>我确认供稿信息真实准确，已如实标注素材使用权限及已知保密或宣传限制。<span className="required"> *</span></span>
                </label>
                {showError("confirmed") && <p className="field-error">{showError("confirmed")}</p>}
              </Section>
              <div className="form-actions"><span>进入预览后可返回修改。</span><button type="submit" className="button primary" disabled={loadingImages}>检查并预览 <ArrowRight size={18} /></button></div>
            </form>}

            {stage === "review" && <div className="review">
              <div className="review-notice"><CheckCircle2 size={21} /><div><strong>必填资料已齐</strong><p>请核对文字、图片与授权确认，再提交给编辑部。</p></div></div>
              <Details category={category} fields={draft.fields} />
              <h3>图片资料 <span className="subtle">（{draft.images.length} 张）</span></h3>
              <div className="review-photos">
                {draft.images.map((picture) => <figure key={picture.id}><img src={picture.url} alt={picture.caption.trim()} /><PictureCaption picture={picture} /></figure>)}
              </div>
              <p className="review-confirmation"><ShieldCheck size={18} />已确认信息准确，并如实标注素材权限与保密限制。</p>
              {serverIssue && <p className="server-error" role="alert">{serverIssue}</p>}
              <div className="form-actions dual">
                <button type="button" className="button secondary" disabled={sending} onClick={() => { setStage("edit"); goToForm(); }}><ArrowLeft size={17} />返回修改</button>
                <button type="button" className="button primary" disabled={sending} onClick={() => void send()}>{sending ? "正在提交…" : "确认提交"}<Send size={17} /></button>
              </div>
            </div>}

            {stage === "success" && receipt && <div className="success-state" role="status">
              <span className="success-icon"><CheckCircle2 size={39} strokeWidth={1.7} /></span>
              <h3>投稿已收到</h3>
              <p className="success-title">{receipt.title}</p>
              <p>{categories[receipt.category].title} · {formatTime.format(new Date(receipt.createdAt))}</p>
              <p className="record-id">稿件编号 {receipt.id}</p>
              <div className="success-actions">
                <button type="button" className="button secondary" onClick={() => { navigate(category); goToForm(); }}>继续投稿</button>
                <button type="button" className="button primary" onClick={() => { setSelectedId(receipt.id); navigate("received"); }}>查看已收稿件<ArrowRight size={17} /></button>
              </div>
            </div>}
          </div>

          <aside className="sidebar" aria-label="投稿要求">
            <section className="side-card checklist" aria-labelledby="checklist-title">
              <div className="side-heading"><span className="small-icon"><ListChecks size={20} /></span><h3 id="checklist-title">提交清单</h3><span className="checklist-count">{stage === "success" ? 4 : completedCount} / 4</span></div>
              <progress value={stage === "success" ? 4 : completedCount} max="4" aria-label="已完成的资料分组" />
              <ul>{sections.map((name, index) => {
                const done = stage === "success" || completed[index];
                return <li key={name}><span className={done ? "status-done" : "status-open"}>{done ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span>
                  {stage === "edit" ? <a href={"#" + sectionIds[index]} onClick={(event) => { event.preventDefault(); document.getElementById(sectionIds[index])?.scrollIntoView({ block: "start", behavior: "smooth" }); }}>{name}</a> : <span>{name}</span>}
                  <span className={done ? "status-text complete" : "status-text"}>{done ? "已完成" : "待补充"}</span>
                </li>;
              })}</ul>
            </section>
            <Guidelines />
            {stage === "edit" && <button type="button" className="sidebar-jump" onClick={() => document.getElementById("images")?.scrollIntoView({ block: "start", behavior: "smooth" })}><Images size={17} />查看图片资料要求<ArrowDown size={15} /></button>}
          </aside>
        </div>
      </>}
    </main>
    <footer className="site-footer"><div className="shell"><span>惟泰安全 · 公众号编辑部</span><span><LockKeyhole size={14} />内部供稿</span></div></footer>
  </>;
}
