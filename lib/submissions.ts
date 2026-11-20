export type Category = "industry" | "project";

export type Field = {
  key: string;
  label: string;
  placeholder: string;
  max: number;
  required: boolean;
  multiline?: boolean;
  hint?: string;
  options?: readonly string[];
};

export const basics: Field[] = [
  { key: "title", label: "供稿标题", placeholder: "用一句话概括主题", max: 80, required: true, hint: "填写工作标题即可，公众号标题由品宣部门编辑。" },
  { key: "industry", label: "所属行业", placeholder: "如 酿酒、氢能、化工或储能", max: 50, required: true },
  { key: "author", label: "投稿人", placeholder: "填写姓名或内部称呼", max: 50, required: true },
];

const projectStages = ["中标", "签约", "供货", "安装", "调试", "验收", "其他阶段"];

export const categories: Record<Category, {
  title: string;
  description: string;
  example: string;
  images: string;
  beforeProducts: Field[];
  afterProducts: Field[];
  internal: Field[];
}> = {
  industry: {
    title: "行业应用",
    description: "介绍典型行业场景、客户安全需求和惟泰安全的产品应用价值。",
    example: "这个行业面临什么安全问题？惟泰安全的哪些产品可以提供帮助？",
    images: "建议提供生产环境、典型场景、产品高清实物图或设备使用、现场检查照片。使用代表性行业素材时，请注明来源和使用权限。",
    beforeProducts: [
      { key: "scene", label: "典型应用场景/案例", placeholder: "简述行业生产特点、常见工艺环节及与产品相关的作业场景。", max: 800, required: true, multiline: true },
      { key: "risk", label: "行业安全需求与客户痛点", placeholder: "描述该场景中的气体或火灾风险、监测要求，以及客户面临的具体问题。", max: 1200, required: true, multiline: true },
    ],
    afterProducts: [
      { key: "value", label: "产品应用价值", placeholder: "结合行业需求，说明产品如何帮助发现异常、提供预警或支持现场安全管理。", max: 1200, required: true, multiline: true },
      { key: "outlook", label: "总结与行业展望", placeholder: "可概括产品对该行业的价值，以及后续值得关注的安全需求。", max: 600, required: false, multiline: true },
      { key: "notes", label: "参考资料或补充说明", placeholder: "可附用于核实信息的资料名称、出处或链接。", max: 600, required: false, multiline: true },
    ],
    internal: [],
  },
  project: {
    title: "项目案例分享",
    description: "梳理真实项目的客户需求、实际涉及的产品、专业服务与阶段性成果。",
    example: "这是一个什么项目？客户为什么选择惟泰安全？我们提供了什么，实际进展如何？",
    images: "建议提供项目现场、实际使用的产品、安装调试或现场服务照片。照片涉及客户信息时，请明确其对外使用权限。",
    beforeProducts: [
      { key: "background", label: "项目背景", placeholder: "如「某储能生产基地」，概括项目类型、建设或合作背景及主要安全需求。", max: 800, required: true, multiline: true, hint: "正文使用行业或场景代称客户。实名资料可填在下方的内部核实区。" },
      { key: "stage", label: "当前项目阶段", placeholder: "选择当前实际阶段", max: 30, required: true, options: projectStages },
      { key: "challenge", label: "客户需求与项目难点", placeholder: "说明客户的监测需求、应用环境，以及产品适配或服务方面的具体难点。", max: 1000, required: true, multiline: true },
    ],
    afterProducts: [
      { key: "approach", label: "项目合作亮点与专业服务", placeholder: "结合事实说明产品适配、技术沟通或服务支持中的亮点。若已有依据，可说明客户选择惟泰安全的原因。", max: 1200, required: true, multiline: true },
      { key: "outcome", label: "项目进展与合作成果", placeholder: "写明当前阶段已完成的工作与可核实成果，如签约、供货、现场支持、调试或验收。", max: 1000, required: true, multiline: true, hint: "尚未完成的工作请按实际状态描述。" },
      { key: "meaning", label: "项目意义与总结", placeholder: "可说明项目对行业应用经验积累或后续服务的意义。", max: 600, required: false, multiline: true },
      { key: "notes", label: "事实依据或补充说明", placeholder: "可提供供内部核实的资料名称或出处。", max: 600, required: false, multiline: true },
    ],
    internal: [
      { key: "projectName", label: "项目名称", placeholder: "填写便于核实的项目名称", max: 160, required: false, hint: "仅供内部核实。" },
      { key: "customerName", label: "客户名称", placeholder: "仅在允许内部提供时填写", max: 160, required: false, hint: "仅供内部核实。" },
      { key: "restrictions", label: "保密协议或对外宣传限制", placeholder: "如客户要求匿名、照片仅供内部参考，或宣传前须另行确认。如有相关约定，请在此说明。", max: 600, required: false, multiline: true },
    ],
  },
};

export const productFields: Field[] = [
  { key: "name", label: "产品名称及型号", placeholder: "按已核实的产品资料填写", max: 160, required: true },
  { key: "medium", label: "检测介质或监测对象", placeholder: "填写经核实的具体检测介质或监测对象", max: 200, required: true },
  { key: "application", label: "应用场景与作用", placeholder: "说明产品用在哪里，以及如何对应现场需求", max: 400, required: true, multiline: true },
  { key: "function", label: "主要功能及特点", placeholder: "填写与该场景有关且已核实的功能及特点", max: 400, required: true, multiline: true },
];

const productStage: Field = {
  key: "status", label: "产品应用状态", placeholder: "选择该产品的实际状态", max: 24, required: true,
  options: ["已中标或纳入合同，尚未供货", "已供货，尚未安装", "已安装，尚未完成调试", "已完成调试，待验收", "已验收或投入使用", "其他已核实状态"],
};

export const MAX_PRODUCTS = 20;
export const PRODUCTS_LABEL = "相关产品及具体应用";

export function getProductFields(category: Category) {
  return category === "project" ? [...productFields, productStage] : productFields;
}

export function parseProducts(value?: string): Record<string, string>[] {
  try {
    const list: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(list) || list.length > MAX_PRODUCTS) return [];
    return list.map((entry) => Object.fromEntries(
      Object.entries(entry && typeof entry === "object" ? entry : {}).filter((pair): pair is [string, string] => typeof pair[1] === "string")
    ));
  } catch {
    return [];
  }
}

export const noPhotosField: Field = {
  key: "noPhotos", label: "暂无图片说明", placeholder: "说明暂无图片的原因，以及预计何时补充或建议使用的素材。",
  max: 500, required: true, multiline: true,
};

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 24 * 1024 * 1024;
export const MAX_CAPTION = 120;
export const MAX_SOURCE = 240;
export const imagePermissions = ["已获公众号使用授权", "仅供内部参考", "对外使用权限待确认"] as const;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type Picture = { name: string; caption: string; size: number; type: string; source?: string; permission?: string };
export type StoredPicture = Picture & { key: string };
export type SavedSubmission = {
  id: string;
  category: Category;
  title: string;
  fields: Record<string, string>;
  images: Picture[];
  createdAt: string;
};
export type Receipt = Pick<SavedSubmission, "id" | "category" | "title" | "createdAt">;

export function isCategory(value: unknown): value is Category {
  return value === "industry" || value === "project";
}

export function getStoryFields(category: Category) {
  const { beforeProducts, afterProducts, internal } = categories[category];
  return [...beforeProducts, ...afterProducts, ...internal];
}

export function getFields(category: Category) {
  return [...basics, ...getStoryFields(category)];
}

export function verifyImage(file: Pick<Picture, "size" | "type">) {
  if (!IMAGE_TYPES.includes(file.type)) return "仅支持 JPG、PNG 或 WebP 图片。";
  if (!Number.isFinite(file.size) || file.size <= 0) return "图片文件为空，请重新选择。";
  if (file.size > MAX_IMAGE_BYTES) return "单张图片须在 8 MB 以内。";
  return "";
}

function fieldError(field: Field, input?: string) {
  const value = input?.trim() ?? "";
  if (!value) return field.required ? `请${field.options ? "选择" : "填写"}${field.label}。` : "";
  if (field.options && !field.options.includes(value)) return `请选择有效的${field.label}。`;
  if (value.length > field.max) return `${field.label}限 ${field.max} 字以内。`;
  return "";
}

export function checkDraft(category: Category, fields: Record<string, string>, images: Picture[], confirmed: boolean) {
  const errors: Record<string, string> = {};
  for (const field of getFields(category)) {
    const error = fieldError(field, fields[field.key]);
    if (error) errors[field.key] = error;
  }
  const products = parseProducts(fields.products);
  const requirements = getProductFields(category);
  if (!products.length) errors.products = "请填写至少一款产品的应用情况。";
  products.forEach((product, index) => {
    for (const field of requirements) {
      const error = fieldError(field, product[field.key]);
      if (error) errors[`product-${index}-${field.key}`] = `产品 ${index + 1}：${error}`;
    }
  });
  if (!images.length) {
    const error = fieldError(noPhotosField, fields.noPhotos);
    if (error) errors.noPhotos = "请上传图片，或填写暂无图片说明。";
  } else if (images.length > MAX_IMAGES) errors.images = "最多上传 5 张图片。";
  else if (images.reduce((sum, image) => sum + image.size, 0) > MAX_TOTAL_BYTES) errors.images = "全部图片合计须在 24 MB 以内。";
  images.forEach((image, index) => {
    const imageError = verifyImage(image);
    if (imageError) errors[`image-${index}`] = imageError;
    if (!image.caption.trim()) errors[`caption-${index}`] = `请填写第 ${index + 1} 张图片的说明。`;
    else if (image.caption.trim().length > MAX_CAPTION) errors[`caption-${index}`] = "图片说明限 120 字以内。";
    if (!image.source?.trim()) errors[`source-${index}`] = `请填写第 ${index + 1} 张图片的来源。`;
    else if (image.source.trim().length > MAX_SOURCE) errors[`source-${index}`] = `图片来源限 ${MAX_SOURCE} 字以内。`;
    if (!imagePermissions.some((permission) => permission === image.permission)) errors[`permission-${index}`] = `请标注第 ${index + 1} 张图片的对外使用权限。`;
  });
  if (!confirmed) errors.confirmed = "请确认供稿信息真实准确，并已如实标注素材权限及已知保密限制。";
  return errors;
}

export const formatTime = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  hourCycle: "h23", timeZone: "Asia/Shanghai",
});
