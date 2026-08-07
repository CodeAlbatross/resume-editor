import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, mdToLines } from '../markdown.ts';

test('renderMarkdown 加粗', () => {
  assert.equal(renderMarkdown('负责**高并发发奖**链路'), '负责<strong>高并发发奖</strong>链路');
});

test('renderMarkdown 斜体', () => {
  assert.equal(renderMarkdown('*斜体文本*'), '<em>斜体文本</em>');
});

test('renderMarkdown 代码', () => {
  assert.equal(renderMarkdown('使用 `QPM` 峰值'), '使用 <code>QPM</code> 峰值');
});

test('renderMarkdown 列表行', () => {
  assert.equal(renderMarkdown('- 支撑秒杀类活动'), '<li>支撑秒杀类活动</li>');
});

test('renderMarkdown 无语法纯文本不变', () => {
  assert.equal(renderMarkdown('普通文本内容'), '普通文本内容');
});

test('mdToLines 分离列表与段落', () => {
  const lines = mdToLines('段落一\n- 列表项A\n- 列表项B');
  assert.deepEqual(lines, [
    { type: 'para', content: '段落一' },
    { type: 'list', items: ['列表项A', '列表项B'] },
  ]);
});
