import { ChevronDown, FileText } from "lucide-react";

export function SubmissionPolicy() {
  return <details className="policy-details">
    <summary><FileText size={19} /><span>微信公众号宣传供稿规范（试行）</span><ChevronDown size={17} /></summary>
    <div className="policy-content">
      <p>适用于各办事处、销售、技术及项目相关人员。请提供真实、准确、具体的基础材料。公众号标题、正文编辑和版式由品宣部门统一处理。</p>
      <div className="policy-columns">
        <section>
          <h3>行业应用</h3>
          <p>说明行业生产特点和典型场景、具体风险及客户痛点。逐款介绍适用产品的名称型号、检测对象、应用场景、功能和实际作用，并总结应用价值。</p>
          <p>应对照真实产品资料核实检测介质、功能与适用场景。配图可选环境、产品实物或设备使用照片，也可提供注明来源和权限的代表性素材。</p>
        </section>
        <section>
          <h3>项目案例分享</h3>
          <p>以真实项目为基础，说明项目背景、客户需求和难点、实际涉及的产品、合作亮点与阶段性成果。按实际情况区分中标、签约、供货、安装、调试及验收。</p>
          <p>填写产品当前状态，准确区分合同约定、已供货和已实际使用。现场、产品、安装调试和服务照片须标注对外使用权限。</p>
        </section>
      </div>
      <h3>共同要求</h3>
      <ul>
        <li>产品功能、介质、资质和相关技术信息请由业务或技术人员核实。宣传表述须有真实资料支撑。</li>
        <li>项目及客户实名资料仅供内部核实。正式宣传前筛选并匿名化未经授权的信息，保密协议或客户宣传限制请随稿说明。</li>
        <li>避免提交内部工艺参数、产能、设备数量、安装点位、系统架构、技术方案、合同或报价等商业敏感信息。</li>
        <li>建议随文字提交清晰配图及来源、权限。暂无图片时请说明，便于品宣部门安排补充。</li>
      </ul>
      <h3>提交与审核流程</h3>
      <ol className="policy-flow">
        {["业务人员供稿", "品宣部门初审", "补充或核实信息", "内容编辑与视觉设计", "技术及相关负责人审核", "正式发布"].map((step) => <li key={step}>{step}</li>)}
      </ol>
    </div>
  </details>;
}
