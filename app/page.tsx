'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { BookOpen, Check, ChevronDown, Coins, Copy, Info, MapPin, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { orders, type Order } from '@/data/orders';
import { hourlyRatesFromPrice } from '@/data/price';

const PAGE_SIZE = 15;

const gradeOptions = ['小学', '初一', '初二', '初三', '高一', '高二', '高三', '大学', '其他'];
const subjectOptions = ['语文', '数学', '英语', '历史', '物理', '政治', '地理', '化学', '生物', '其他'];
const amountCategoryOptions = ['高价单', '普通单', '返额单'];
const districtOptions = [
  '东城区',
  '西城区',
  '朝阳区',
  '丰台区',
  '石景山区',
  '海淀区',
  '门头沟区',
  '房山区',
  '通州区',
  '顺义区',
  '昌平区',
  '大兴区',
  '怀柔区',
  '平谷区',
  '密云区',
  '延庆区',
  '线上',
  '其他',
];

function gradeCategory(grade: string) {
  if (grade.startsWith('小学')) return '小学';
  if (grade.startsWith('大学')) return '大学';
  return gradeOptions.includes(grade) ? grade : '其他';
}

function orderText(order: Order) {
  if (order.isRebate) {
    return `有返额:
【年级科目】${order.gradeSubject}
【辅导地点】${order.district === '其他' ? order.area : `${order.district}${order.area}`}
【辅导方式】${order.mode}
【课费报酬】${order.price}
【时间次数】${order.schedule}
【学员情况】${order.score}
【其他要求】${order.requirement}`;
  }

  return `${order.code}号家教
【学生性别】：${order.gender}
【学生年级】：${order.grade}
【补习科目】：${order.subject}
【现阶段成绩】：${order.score}
【补习时间】：${order.schedule}
【报价】：${order.price}
【地址】：${order.district === '其他' ? order.area : `${order.district}${order.area}`}
【对老师要求】：${order.requirement}`;
}

function copyTextFallback(text: string) {
  const textArea = document.createElement('textarea');
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  textArea.value = text;
  textArea.readOnly = true;
  textArea.setAttribute('aria-hidden', 'true');
  textArea.style.position = 'fixed';
  textArea.style.inset = '0 auto auto 0';
  textArea.style.width = '1px';
  textArea.style.height = '1px';
  textArea.style.padding = '0';
  textArea.style.border = '0';
  textArea.style.opacity = '0';
  textArea.style.fontSize = '16px';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);

  try {
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    // oxlint-disable-next-line typescript/no-deprecated -- Required as an HTTP-only clipboard fallback.
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textArea.remove();
    activeElement?.focus({ preventScroll: true });
  }
}

function MultiSelectFilter({ label, icon, options, values, onChange }: {
  label: string;
  icon: ReactNode;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const summary = values.length === 0 ? `全部${label}` : values.length === 1 ? values[0] : `已选 ${values.length} 项`;
  const toggle = (option: string, checked: boolean) => {
    onChange(checked ? [...values, option] : values.filter((value) => value !== option));
  };

  return (
    <div className="filter-field">
      <span>{icon}{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="multi-select-trigger" aria-label={`${label}多选筛选，当前${summary}`}>
          <span>{summary}</span><ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="multi-select-content" align="end" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="multi-select-label">
              <span>{label}（可多选）</span>
              {values.length > 0 && <button type="button" onClick={() => onChange([])}>清空</button>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                className="multi-select-item"
                checked={values.includes(option)}
                onCheckedChange={(checked) => toggle(option, checked)}
              >
                {option}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function Home() {
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [amountCategories, setAmountCategories] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [copiedOrder, setCopiedOrder] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      const haystack = `${order.code}${order.amountCategory}${order.district}${order.area}${order.gradeSubject}${order.grade}${order.subject}${order.mode}${order.gender}${order.score}${order.requirement}`.toLowerCase();
      return (grades.length === 0 || grades.includes(gradeCategory(order.grade)))
        && (subjects.length === 0 || subjects.includes(subjectOptions.includes(order.subject) ? order.subject : '其他'))
        && (districts.length === 0 || districts.includes(districtOptions.includes(order.district) ? order.district : '其他'))
        && (amountCategories.length === 0 || amountCategories.includes(order.amountCategory))
        && (!keyword || haystack.includes(keyword));
    });
  }, [amountCategories, districts, grades, query, subjects]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pageOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const priceNumbers = orders.flatMap((order) => hourlyRatesFromPrice(order.price));
  const formatPrice = (price: number) => Number.isInteger(price) ? String(price) : price.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  const priceRange = priceNumbers.length
    ? `￥${formatPrice(Math.min(...priceNumbers))} - ￥${formatPrice(Math.max(...priceNumbers))}`
    : '待更新';
  const resetFilters = () => { setGrades([]); setSubjects([]); setDistricts([]); setAmountCategories([]); setQuery(''); setCurrentPage(1); };
  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    window.requestAnimationFrame(() => document.getElementById('order-list-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const showCopied = (orderId: number) => {
    setCopiedOrder(orderId);
    window.setTimeout(() => setCopiedOrder((current) => current === orderId ? null : current), 1600);
  };
  const copyOrder = (order: Order) => {
    const text = orderText(order);

    // Async Clipboard is restricted to HTTPS/localhost. NATAPP's free HTTP
    // address therefore needs the synchronous selection-based fallback.
    if (!window.isSecureContext || !navigator.clipboard?.writeText) {
      if (copyTextFallback(text)) {
        showCopied(order.id);
      } else {
        window.prompt('自动复制受浏览器限制，请长按下方内容复制：', text);
      }
      return;
    }

    void navigator.clipboard.writeText(text)
      .then(() => showCopied(order.id))
      .catch(() => {
        if (copyTextFallback(text)) {
          showCopied(order.id);
        } else {
          window.prompt('自动复制受浏览器限制，请长按下方内容复制：', text);
        }
      });
  };

  return (
    <main className="site-shell" id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="家教接单台首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>家教<span>/</span>接单台</span>
        </a>
        <div className="header-actions"><span className="live-status"><i /> 当前 {orders.length} 单</span></div>
      </header>

      <section className="workspace-intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">北京地区 · 家教订单实时更新</p>
          <h1 id="page-title">找到合适的一课，及时接单。</h1>
          <p className="intro-copy">按年级、科目、区域和单额筛选，快速判断时间与报酬是否合适。</p>
        </div>
        <div className="quick-stats" aria-label="订单概况">
          <div><strong>{orders.length}</strong><span>开放订单</span></div>
          <div><strong>{priceRange}</strong><span>时薪范围</span></div>
        </div>
      </section>

      <section className="command-deck" aria-label="搜索和筛选家教订单">
        <div className="search-row">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="order-search">搜索区域、科目或要求</label>
          <input id="order-search" value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="搜索区域、科目或教学要求……" autoComplete="off" />
          {query ? <button className="clear-query" onClick={() => { setQuery(''); setCurrentPage(1); }}>清除</button> : <kbd>Ctrl K</kbd>}
        </div>
        <div className="filter-grid">
          <MultiSelectFilter label="年级" icon={<BookOpen />} options={gradeOptions} values={grades} onChange={(values) => { setGrades(values); setCurrentPage(1); }} />
          <MultiSelectFilter label="科目" icon={<Sparkles />} options={subjectOptions} values={subjects} onChange={(values) => { setSubjects(values); setCurrentPage(1); }} />
          <MultiSelectFilter label="区域" icon={<MapPin />} options={districtOptions} values={districts} onChange={(values) => { setDistricts(values); setCurrentPage(1); }} />
          <MultiSelectFilter label="单额" icon={<Coins />} options={amountCategoryOptions} values={amountCategories} onChange={(values) => { setAmountCategories(values); setCurrentPage(1); }} />
        </div>
      </section>

      <output className="notice"><Info aria-hidden="true" /><p><strong>接单提示</strong> 订单联系方式将在平台确认教师身份后展示，请勿提前支付任何费用。</p></output>

      <section className="order-directory" aria-labelledby="order-list-title">
        <div className="section-heading">
          <div><p className="section-kicker">ORDER BOARD</p><h2 id="order-list-title">最新家教订单</h2></div>
          <p className="result-count" aria-live="polite">找到 <strong>{filteredOrders.length}</strong> 个订单 · 第 {currentPage}/{totalPages} 页</p>
        </div>

        {filteredOrders.length ? <div className="order-grid">
          {pageOrders.map((order) => <article className="order-card" key={order.id}>
            <div className="card-topline">
              <h3 className="order-number">{order.isRebate ? '有返额' : `${order.code}号家教`}</h3>
              <button type="button" className={`copy-button ${copiedOrder === order.id ? 'is-copied' : ''}`} aria-label={`复制${order.isRebate ? '返额单' : `${order.code}号家教`}全部信息`} onClick={() => copyOrder(order)}>
                {copiedOrder === order.id ? <Check /> : <Copy />}
                <span>{copiedOrder === order.id ? '已复制' : '复制'}</span>
              </button>
            </div>
            {order.isRebate ? <div className="order-copy-block">
              <p><strong>【年级科目】：</strong>{order.gradeSubject}</p>
              <p className="address-line"><strong>【辅导地点】：</strong>{order.district === '其他' ? order.area : `${order.district}${order.area}`}</p>
              <p><strong>【辅导方式】：</strong>{order.mode}</p>
              <p><strong>【课费报酬】：</strong><em>{order.price}</em></p>
              <p><strong>【时间次数】：</strong>{order.schedule}</p>
              <p><strong>【学员情况】：</strong>{order.score}</p>
              <p className="teacher-requirement"><strong>【其他要求】：</strong>{order.requirement}</p>
            </div> : <div className="order-copy-block">
              <p><strong>【学生性别】：</strong>{order.gender}</p>
              <p><strong>【学生年级】：</strong>{order.grade}</p>
              <p><strong>【补习科目】：</strong>{order.subject}</p>
              <p><strong>【现阶段成绩】：</strong>{order.score}</p>
              <p><strong>【补习时间】：</strong>{order.schedule}</p>
              <p><strong>【报价】：</strong><em>{order.price}</em></p>
              <p className="address-line"><strong>【地址】：</strong>{order.district === '其他' ? order.area : `${order.district}${order.area}`}</p>
              <p className="teacher-requirement"><strong>【对老师要求】：</strong>{order.requirement}</p>
            </div>}
            <div className="card-meta"><span className="amount-category" data-category={order.amountCategory}>{order.amountCategory}</span><span>信息已核验</span></div>
          </article>)}
        </div> : <div className="empty-state"><SlidersHorizontal /><h3>{orders.length ? '没有符合条件的订单' : '订单正在更新'}</h3><p>{orders.length ? '换一组筛选条件，或者查看全部订单。' : '暂时还没有可展示的家教订单，请稍后再来查看。'}</p>{orders.length > 0 && <Button type="button" onClick={resetFilters}>重置筛选</Button>}</div>}

        {filteredOrders.length > PAGE_SIZE && <Pagination className="order-pagination">
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#order-list-title" text="上一页" aria-disabled={currentPage === 1} className={currentPage === 1 ? 'is-disabled' : ''} onClick={(event) => { event.preventDefault(); if (currentPage > 1) changePage(currentPage - 1); }} /></PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <PaginationItem key={page}><PaginationLink href="#order-list-title" isActive={page === currentPage} onClick={(event) => { event.preventDefault(); changePage(page); }}>{page}</PaginationLink></PaginationItem>)}
            <PaginationItem><PaginationNext href="#order-list-title" text="下一页" aria-disabled={currentPage === totalPages} className={currentPage === totalPages ? 'is-disabled' : ''} onClick={(event) => { event.preventDefault(); if (currentPage < totalPages) changePage(currentPage + 1); }} /></PaginationItem>
          </PaginationContent>
        </Pagination>}
      </section>

      <footer><span>家教接单台 · 订单信息持续更新</span><a href="#top">返回顶部</a></footer>

    </main>
  );
}
