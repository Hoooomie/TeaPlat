export const beijingDistricts = [
  '东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区',
  '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区',
  '怀柔区', '平谷区', '密云区', '延庆区',
] as const;

export function beijingDistrictFromText(...values: string[]) {
  const text = values.join(' ');
  return beijingDistricts.find((district) => {
    const shortName = district.replace(/区$/, '');
    return text.includes(district) || text.includes(shortName);
  });
}

export function stripBeijingDistrictPrefix(address: string, district: string) {
  const shortName = district.replace(/区$/, '');
  const prefixPattern = new RegExp(`^(?:地址\\s*[：:]?\\s*)?(?:北京市?\\s*)?${shortName}\\s*区?\\s*[·•，,：:\\-]?\\s*`);
  return address.replace(prefixPattern, '').trim();
}
