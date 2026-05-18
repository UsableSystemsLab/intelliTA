import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Maincontent from './Maincontent';

beforeEach(() => {
  Object.defineProperty(global.navigator, 'clipboard', {
    value: { writeText: jest.fn(() => Promise.resolve()) },
    configurable: true,
  });
});

describe('TestExamples Maincontent', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <Maincontent />
      </MemoryRouter>
    );
  }

  test('renders title heading and breadcrumb link', () => {
    const { container } = renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /docs\.tests\.title/i })
    ).toBeInTheDocument();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/docs']));
  });

  test('renders the expected section anchors', () => {
    const { container } = renderPage();
    for (const id of ['overview', 'naming', 'rules', 'examples', 'bound-test', 'assertions', 'mistakes']) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  test('defaults to Python and shows greeting.py example', () => {
    renderPage();
    expect(screen.getAllByText('greeting.py').length).toBeGreaterThan(0);
    expect(screen.getAllByText('test_greeting.py').length).toBeGreaterThan(0);
  });

  test('switching to Java shows Calculator.java starter and CalculatorTest.java', () => {
    renderPage();
    const javaBtn = screen.getAllByRole('button', { name: 'Java' })[0];
    fireEvent.click(javaBtn);
    expect(screen.getAllByText('Calculator.java').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CalculatorTest.java').length).toBeGreaterThan(0);
  });

  test('switching to JavaScript shows filter.js and filter.test.js', () => {
    renderPage();
    const jsBtn = screen.getAllByRole('button', { name: 'JavaScript' })[0];
    fireEvent.click(jsBtn);
    expect(screen.getAllByText('filter.js').length).toBeGreaterThan(0);
    expect(screen.getAllByText('filter.test.js').length).toBeGreaterThan(0);
  });

  test('clicking a copy button invokes clipboard.writeText', () => {
    renderPage();
    const copyBtns = screen.getAllByRole('button', { name: /docs\.copy$/i });
    fireEvent.click(copyBtns[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
