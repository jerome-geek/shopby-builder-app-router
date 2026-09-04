export * from './BlockRenderer'
export * from './BannerGrid'
export * from './BannerSlider'
export * from './CategoryNav'
export * from './Footer'
export * from './Header'
export * from './ProductList'

// Note: this barrel re-exports every block, including `ProductList` and
// `CategoryNav`, which import `next/headers` and are server-only. A
// bundler tracing an import from this barrel walks the whole module
// graph, so importing *anything* from '@repo/blocks' inside a Client
// Component pulls those in too and breaks the client build — even if
// only a client-safe named export is actually used. Client code that
// needs an individual client-safe block (BannerSlider/BannerGrid/
// Header/Footer) must import it by file path, e.g.
// `import BannerGrid from '@repo/blocks/BannerGrid'`, bypassing this
// barrel. See apps/admin/src/components/builder/BuilderPreview.tsx.
