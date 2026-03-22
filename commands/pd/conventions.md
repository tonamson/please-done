---
name: pd:conventions
description: "Phân tích dự án và tạo CLAUDE.md chứa quy ước code riêng (phong cách code, đặt tên, patterns)"
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Phân tích dự án hiện tại, phát hiện coding conventions, hỏi user về ưu tiên cá nhân, và tạo/cập nhật file CLAUDE.md.
</objective>

<execution_context>
@workflows/conventions.md
@references/conventions.md
</execution_context>

<context>
User input: $ARGUMENTS
</context>

<process>
Thực thi quy trình từ @workflows/conventions.md từ đầu đến cuối.
</process>
