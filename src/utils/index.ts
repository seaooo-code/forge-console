/** 是否包含换行等控制字符；构建适配器参数值和默认值都不允许，与后端校验一致。 */
export function hasControlCharacter(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}
