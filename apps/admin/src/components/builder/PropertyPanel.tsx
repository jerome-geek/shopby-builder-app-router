'use client'

import type {
  AnyBlock,
  Block,
  CategoryNavProps,
  FooterProps,
  HeaderProps,
  ProductListProps,
} from '@repo/types'
import { Plus, Trash2 } from 'lucide-react'

interface PropertyPanelProps {
  block: AnyBlock
  onChange: (props: Block['props']) => void
}

const fieldLabel = 'block text-xs font-medium text-gray-500 mb-1'
const fieldInput =
  'w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none'

export function PropertyPanel({ block, onChange }: PropertyPanelProps) {
  switch (block.type) {
    case 'BannerSlider':
      return (
        <BannerImagesForm
          images={block.props.images}
          extra={
            <>
              <NumberField
                label="전환 간격(ms)"
                value={block.props.interval ?? 4000}
                onChange={(interval) => onChange({ ...block.props, interval })}
              />
              <CheckboxField
                label="자동 재생"
                checked={block.props.autoplay ?? true}
                onChange={(autoplay) => onChange({ ...block.props, autoplay })}
              />
            </>
          }
          onChange={(images) => onChange({ ...block.props, images })}
        />
      )
    case 'BannerGrid':
      return (
        <BannerImagesForm
          images={block.props.images}
          extra={
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="PC 열 수"
                value={block.props.columns?.pc ?? 3}
                onChange={(pc) =>
                  onChange({ ...block.props, columns: { ...block.props.columns, pc } })
                }
              />
              <NumberField
                label="모바일 열 수"
                value={block.props.columns?.mo ?? 1}
                onChange={(mo) =>
                  onChange({ ...block.props, columns: { ...block.props.columns, mo } })
                }
              />
            </div>
          }
          onChange={(images) => onChange({ ...block.props, images })}
        />
      )
    case 'ProductList':
      return <ProductListForm props={block.props} onChange={onChange} />
    case 'CategoryNav':
      return <CategoryNavForm props={block.props} onChange={onChange} />
    case 'Header':
      return <HeaderForm props={block.props} onChange={onChange} />
    case 'Footer':
      return <FooterForm props={block.props} onChange={onChange} />
  }
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className={fieldLabel}>
      {label}
      <input
        type="text"
        className={fieldInput}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className={fieldLabel}>
      {label}
      <input
        type="number"
        className={fieldInput}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

function BannerImagesForm({
  images,
  onChange,
  extra,
}: {
  images: Array<{ url: string; link?: string; alt?: string }>
  onChange: (images: Array<{ url: string; link?: string; alt?: string }>) => void
  extra?: React.ReactNode
}) {
  function updateImage(index: number, patch: Partial<{ url: string; link?: string; alt?: string }>) {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {images.map((image, index) => (
          <div key={index} className="rounded-md border border-gray-200 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">이미지 {index + 1}</span>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <TextField
              label="이미지 URL"
              value={image.url}
              onChange={(url) => updateImage(index, { url })}
              placeholder="https://..."
            />
            <TextField
              label="링크(선택)"
              value={image.link ?? ''}
              onChange={(link) => updateImage(index, { link })}
            />
            <TextField
              label="대체 텍스트(선택)"
              value={image.alt ?? ''}
              onChange={(alt) => updateImage(index, { alt })}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...images, { url: '' }])}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
      >
        <Plus size={14} />
        이미지 추가
      </button>
      {extra}
    </div>
  )
}

function ProductListForm({
  props,
  onChange,
}: {
  props: ProductListProps
  onChange: (props: ProductListProps) => void
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="제목(선택)"
        value={props.title ?? ''}
        onChange={(title) => onChange({ ...props, title })}
      />
      <label className={fieldLabel}>
        정렬
        <select
          className={fieldInput}
          value={props.apiParams.sort ?? 'NEW'}
          onChange={(e) =>
            onChange({
              ...props,
              apiParams: { ...props.apiParams, sort: e.target.value as ProductListProps['apiParams']['sort'] },
            })
          }
        >
          <option value="NEW">신상품순</option>
          <option value="BEST">인기순</option>
          <option value="SALE">할인율순</option>
          <option value="LOW_PRICE">낮은가격순</option>
          <option value="HIGH_PRICE">높은가격순</option>
        </select>
      </label>
      <NumberField
        label="노출 개수"
        value={props.apiParams.pageSize ?? 8}
        onChange={(pageSize) => onChange({ ...props, apiParams: { ...props.apiParams, pageSize } })}
      />
      <label className={fieldLabel}>
        레이아웃
        <select
          className={fieldInput}
          value={props.layout ?? 'grid'}
          onChange={(e) => onChange({ ...props, layout: e.target.value as ProductListProps['layout'] })}
        >
          <option value="grid">그리드</option>
          <option value="list">리스트</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="PC 열 수"
          value={props.columns?.pc ?? 4}
          onChange={(pc) => onChange({ ...props, columns: { ...props.columns, pc } })}
        />
        <NumberField
          label="모바일 열 수"
          value={props.columns?.mo ?? 2}
          onChange={(mo) => onChange({ ...props, columns: { ...props.columns, mo } })}
        />
      </div>
    </div>
  )
}

function CategoryNavForm({
  props,
  onChange,
}: {
  props: CategoryNavProps
  onChange: (props: CategoryNavProps) => void
}) {
  return (
    <div className="space-y-3">
      <CheckboxField
        label="'전체' 항목 표시"
        checked={props.showAll ?? true}
        onChange={(showAll) => onChange({ ...props, showAll })}
      />
      <NumberField
        label="표시 깊이"
        value={props.depth ?? 1}
        onChange={(depth) => onChange({ ...props, depth })}
      />
    </div>
  )
}

function HeaderForm({
  props,
  onChange,
}: {
  props: HeaderProps
  onChange: (props: HeaderProps) => void
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="로고 이미지 URL"
        value={props.logoUrl ?? ''}
        onChange={(logoUrl) => onChange({ ...props, logoUrl })}
      />
      <TextField
        label="로고 링크"
        value={props.logoLink ?? ''}
        onChange={(logoLink) => onChange({ ...props, logoLink })}
      />
    </div>
  )
}

function FooterForm({
  props,
  onChange,
}: {
  props: FooterProps
  onChange: (props: FooterProps) => void
}) {
  const links = props.links ?? []

  function updateLink(index: number, patch: Partial<{ label: string; href: string }>) {
    onChange({ ...props, links: links.map((l, i) => (i === index ? { ...l, ...patch } : l)) })
  }

  return (
    <div className="space-y-3">
      <TextField
        label="저작권 문구"
        value={props.copyright ?? ''}
        onChange={(copyright) => onChange({ ...props, copyright })}
      />
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="rounded-md border border-gray-200 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">링크 {index + 1}</span>
              <button
                type="button"
                onClick={() => onChange({ ...props, links: links.filter((_, i) => i !== index) })}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <TextField label="라벨" value={link.label} onChange={(label) => updateLink(index, { label })} />
            <TextField label="URL" value={link.href} onChange={(href) => updateLink(index, { href })} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange({ ...props, links: [...links, { label: '', href: '' }] })}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
      >
        <Plus size={14} />
        링크 추가
      </button>
    </div>
  )
}
