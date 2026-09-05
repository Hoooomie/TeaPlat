import rawOrders from './orders.txt?raw';

export type Order = {
  id: number;
  code: string;
  district: string;
  area: string;
  grade: string;
  subject: string;
  gender: string;
  score: string;
  schedule: string;
  price: string;
  requirement: string;
};

const beijingDistricts = [
  '东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区',
  '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区',
  '怀柔区', '平谷区', '密云区', '延庆区',
] as const;

const orderHeadingPattern = /^(\d{4,})\s*号?\s*家教/;
const separatorPattern = /^\s*(?:-{3,}|—{3,})\s*$/;
const fieldPattern = /^【\s*([^】]+?)\s*】\s*[：:]\s*(.*)$/;

function splitOrderBlocks(source: string) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const blocks: string[][] = [];
  let current: string[] = [];

  const pushCurrent = () => {
    if (current.some((line) => orderHeadingPattern.test(line.trim()))) blocks.push(current);
    current = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (separatorPattern.test(line)) {
      pushCurrent();
      continue;
    }
    if (orderHeadingPattern.test(line) && current.some((item) => orderHeadingPattern.test(item.trim()))) {
      pushCurrent();
    }
    current.push(line);
  }

  pushCurrent();
  return blocks;
}

function readFields(lines: string[]) {
  const fields = new Map<string, string>();
  let activeKey = '';

  for (const line of lines) {
    const match = line.match(fieldPattern);
    if (match) {
      activeKey = match[1].replace(/\s+/g, '');
      fields.set(activeKey, match[2].trim());
      continue;
    }
    if (activeKey && !orderHeadingPattern.test(line)) {
      fields.set(activeKey, `${fields.get(activeKey) ?? ''}\n${line}`.trim());
    }
  }

  return fields;
}

function firstField(fields: Map<string, string>, ...names: string[]) {
  for (const name of names) {
    const value = fields.get(name);
    if (value) return value;
  }
  return '';
}

function resolveAddress(fields: Map<string, string>) {
  const address = firstField(fields, '地址', '家教地址', '授课地址') || '地址待确认';
  const selectedDistrict = firstField(fields, '区域', '地区');
  const district = beijingDistricts.find((item) => selectedDistrict.includes(item) || address.includes(item))
    ?? (/线上|网课|网络授课|远程|腾讯会议/.test(`${selectedDistrict}${address}`) ? '线上' : '其他');
  const area = district === '其他'
    ? address
    : address.replace(new RegExp(`^${district}`), '').trim() || (district === '线上' ? '线上授课' : '地址待确认');

  return { district, area };
}

export function parseOrders(source: string): Order[] {
  return splitOrderBlocks(source).flatMap((lines, index) => {
    const heading = lines.find((line) => orderHeadingPattern.test(line));
    const code = heading?.match(orderHeadingPattern)?.[1];
    if (!code) return [];

    const fields = readFields(lines);
    const { district, area } = resolveAddress(fields);

    return [{
      id: index + 1,
      code,
      district,
      area,
      gender: firstField(fields, '学生性别', '性别') || '暂未提供',
      grade: firstField(fields, '学生年级', '年级') || '其他',
      subject: firstField(fields, '补习科目', '科目') || '其他',
      score: firstField(fields, '现阶段成绩', '学生成绩', '成绩') || '暂未提供',
      schedule: firstField(fields, '补习时间', '授课时间', '时间') || '时间协商',
      price: firstField(fields, '报价', '课时费', '时薪') || '面议',
      requirement: firstField(fields, '对老师要求', '老师要求', '教师要求') || '暂无特殊要求',
    }];
  });
}

export const orders = parseOrders(rawOrders);
