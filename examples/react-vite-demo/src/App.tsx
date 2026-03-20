function HeroPanel() {
  return (
    <section className="hero-panel">
      <div className="hero-panel__copy">
        <span className="eyebrow">Pi UI Bridge Demo</span>
        <h1>在真实页面上点选 UI，然后直接把需求发给 Pi</h1>
        <p>这个 demo 用来验证 source binder 注入出来的 data-pi-source-* 元信息。</p>
      </div>
      <div className="hero-panel__actions">
        <button className="primary-btn">马上开始</button>
        <button className="ghost-btn">查看详情</button>
      </div>
    </section>
  );
}

function FeatureCard(props: { title: string; copy: string }) {
  return (
    <article className="feature-card">
      <h2>{props.title}</h2>
      <p>{props.copy}</p>
      <button className="secondary-btn">发送给 Pi</button>
    </article>
  );
}

export default function App() {
  return (
    <main className="page-shell">
      <HeroPanel />
      <section className="feature-grid">
        <FeatureCard title="页面到源码" copy="点击真实 DOM 节点，读取 sourceHint，直接绑定源码位置。" />
        <FeatureCard title="结构化请求" copy="不再手工复制 prompt，而是将选择上下文直接发给 pi 会话。" />
        <FeatureCard title="最小修改" copy="基于选中元素的上下文做最小范围修改，而不是盲目全局重构。" />
      </section>
    </main>
  );
}
