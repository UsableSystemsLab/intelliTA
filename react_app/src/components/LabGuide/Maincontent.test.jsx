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

afterEach(() => {
  jest.useRealTimers();
});

describe('LabGuide Maincontent', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <Maincontent />
      </MemoryRouter>
    );
  }

  test('renders title and breadcrumb link to /courses', () => {
    const { container } = renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /docs\.labs\.title/i })
    ).toBeInTheDocument();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/courses']));
  });

  test('renders all expected section anchors', () => {
    const { container } = renderPage();
    for (const id of ['concept', 'flow', 'creation', 'checkpoints', 'tests', 'hints', 'example']) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  test('language tabs default to Python and switch to Java when clicked', () => {
    const { container } = renderPage();
    expect(screen.getAllByText('test_calculator.py').length).toBeGreaterThan(0);
    const javaBtn = screen.getAllByRole('button', { name: 'Java' })[0];
    fireEvent.click(javaBtn);
    expect(screen.getAllByText('CalculatorTest.java').length).toBeGreaterThan(0);
  });

  test('switching to JavaScript reveals .test.js example file', () => {
    renderPage();
    const jsBtn = screen.getAllByRole('button', { name: 'JavaScript' })[0];
    fireEvent.click(jsBtn);
    expect(screen.getAllByText('calculator.test.js').length).toBeGreaterThan(0);
  });

  test('clicking copy button writes the example code to clipboard', () => {
    jest.useFakeTimers();
    renderPage();
    const copyBtns = screen.getAllByRole('button', { name: /docs\.copy$/i });
    fireEvent.click(copyBtns[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
