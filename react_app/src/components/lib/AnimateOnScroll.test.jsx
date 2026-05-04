import React from 'react';
import { render, screen, act } from '@testing-library/react';
import AnimateOnScroll from './AnimateOnScroll';

let observerCallback;
const observerInstance = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
};

beforeAll(() => {
  global.IntersectionObserver = jest.fn((cb) => {
    observerCallback = cb;
    return observerInstance;
  });
});

beforeEach(() => {
  observerInstance.observe.mockClear();
  observerInstance.unobserve.mockClear();
  observerInstance.disconnect.mockClear();
});

describe('AnimateOnScroll', () => {
  test('renders children', () => {
    render(
      <AnimateOnScroll>
        <span>hello</span>
      </AnimateOnScroll>
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  test('starts hidden (opacity-0) when not in view', () => {
    const { container } = render(
      <AnimateOnScroll>
        <span>content</span>
      </AnimateOnScroll>
    );
    expect(container.firstChild).toHaveClass('opacity-0');
    expect(container.firstChild).not.toHaveClass('opacity-100');
  });

  test('becomes visible when element enters viewport', () => {
    const { container } = render(
      <AnimateOnScroll>
        <span>content</span>
      </AnimateOnScroll>
    );
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });
    expect(container.firstChild).toHaveClass('opacity-100');
    expect(observerInstance.unobserve).toHaveBeenCalled();
  });

  test('renders with custom tag', () => {
    const { container } = render(
      <AnimateOnScroll as="section">
        <span>test</span>
      </AnimateOnScroll>
    );
    expect(container.firstChild.tagName).toBe('SECTION');
  });

  test('applies transitionDelay style from delay prop', () => {
    const { container } = render(
      <AnimateOnScroll delay={250}>
        <span>delayed</span>
      </AnimateOnScroll>
    );
    expect(container.firstChild).toHaveStyle({ transitionDelay: '250ms' });
  });

  test('forwards extra className', () => {
    const { container } = render(
      <AnimateOnScroll className="my-extra">
        <span>x</span>
      </AnimateOnScroll>
    );
    expect(container.firstChild).toHaveClass('my-extra');
  });
});
