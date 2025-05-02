export const Salt = () => {
  function getSalt(): string {
    return `____${import.meta.env?.DEV ? 'dev' : 'prod'}`
  }

  function addSalt(code: string): string {
    return `${code}${getSalt()}`
  }

  function clearSalt(code: string): string {
    return code
      .replace('____dev', '')
      .replace('____prod', '')
  }

  return {
    addSalt,
    clearSalt
  }
}
