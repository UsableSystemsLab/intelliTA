describe('sanity', () => {
  test('jest runs', () => {
    expect(1 + 1).toBe(2);
  });

  test('jest-dom matchers are loaded', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    document.body.appendChild(el);
    expect(el).toHaveTextContent('hello');
    document.body.removeChild(el);
  });
});
