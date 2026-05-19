# Design: skill-e2e-testing

> Date: 2026-05-19
> Status: Draft

## Summary

A new skill for end-to-end testing of other skills. The skill follows a 6-stage linear pipeline: user input → clarification → test case generation → test execution → self-healing loop → summary report. It targets all types of skills (browser automation, code generation, document generation, design, etc.) and uses isolated subagents for test execution.

## File Structure

```
.claude/skills/skill-e2e-testing/
├── SKILL.md                          # Main skill file
└── references/
    └── test-case-format.md           # Test case document template
```

Test case documents are persisted to:

```
docs/skill-e2e-testing/YYYY-MM-DD-<skill-name>.md
```

## 6-Stage Pipeline

### Stage 1: User Input

**Trigger:** `/skill-e2e-testing <skill-name> [测试目标] [测试要求]`

Minimum input: skill name only. User may optionally provide test objectives and requirements.

If test objectives are not provided, Stage 2 extracts them from the target skill's SKILL.md and asks for confirmation.

### Stage 2: Clarification

1. **Auto-explore** the target skill:
   - Read `SKILL.md` for core workflow, triggers, and output
   - Check `references/` and `scripts/` directories for supporting materials
   - Check project for related code files the skill interacts with
2. **Assess completeness:** compare available information against testing needs
3. **Iterative Q&A:** ask one question at a time (multiple choice preferred) until all information is sufficient

Key information to identify:
- Skill trigger conditions (when to use)
- Core workflow and output artifacts
- Tool/script dependencies
- Prerequisites (dev server, specific files, environment setup, etc.)

### Stage 3: Test Case Generation

Write test case document to `docs/skill-e2e-testing/YYYY-MM-DD-<skill-name>.md`.

**Document format:**

```markdown
# 测试用例: <skill-name>

## 测试摘要
Brief description of test scope and purpose

## 测试的 Skill
- 名称: xxx
- 位置: xxx
- 描述: xxx

## 测试目标
1. Objective 1
2. Objective 2

## 测试数据
Test data generated based on skill characteristics, objectives, and context

## 测试用例

### TC-001: <case title>
- **目标:** Which test objective this covers
- **优先级:** P0/P1/P2
- **Given:** Preconditions
- **When:** Actions to perform
- **Then:** Expected results
```

### Stage 4: Test Execution

- Each test case runs in an isolated subagent via the Agent tool
- Subagent prompt includes: target skill key info, specific test steps, expected result criteria
- Subagent invokes the target skill via the Skill tool, then evaluates results
- Subagent returns: pass/fail + actual output + error info (if any)

**Subagent prompt template:**

```
你是一个测试执行者。请执行以下测试用例：

## 目标 Skill 信息
- 名称: {skill-name}
- 位置: {skill-path}
- 关键说明: {core workflow extracted from SKILL.md}

## 测试用例
- 编号: {TC-id}
- 描述: {case description}
- Given: {preconditions}
- When: {actions}
- Then: {expected results}

## 执行步骤
1. 使用 Skill 工具调用 {skill-name}
2. 按测试用例的 When 部分执行操作
3. 将实际结果与 Then 部分对比
4. 返回测试结果

## 输出格式
请返回 JSON：
{
  "test_case_id": "TC-001",
  "status": "pass" | "fail",
  "actual_output": "实际输出的描述",
  "error": "如果有错误，描述错误信息",
  "evidence": "支持判断的证据（如文件内容、命令输出等）"
}
```

### Stage 5: Self-Healing Loop

**Flow:**

```
Test fails
  → Root cause analysis
  → Severity assessment
  → Simple issue → auto-fix SKILL.md/code → re-test (back to Stage 4)
  → Complex issue → generate fix proposal → ask user → fix after confirmation → re-test
  → Same issue 5× unresolved → escalate to user with full diagnostics
```

**Simple issue criteria** (auto-fix):
- Spelling/grammar errors
- Format inconsistencies
- Missing prerequisite descriptions
- Stale path references

**Complex issue criteria** (user confirmation required):
- Workflow logic errors
- Tool dependency conflicts
- Output format mismatch with description
- Partial refactoring needed

**Retry tracking:** "same issue" means the root cause is substantively the same as a previous failure. New issues introduced by a fix do not count toward the 5-retry limit.

### Stage 6: Summary Report

Append to the test case document:

```markdown
## 测试总结

### 统计
- 通过: X
- 失败: Y (其中 Z 已修复)
- 跳过: W

### 修改记录
| 文件 | 修改内容 | 原因 |
|------|----------|------|
| ... | ... | ... |

### 失败用例详情
- TC-003: [已修复] ...
- TC-005: [待修复] ...

### 遗留问题与建议
1. ...
```

## Iron Rules

1. **No skipping stages** — must execute 1→2→3→4→5→6 in order
2. **Document first, execute second** — all test cases must be written to the doc before execution
3. **Subagent isolation** — each test case runs in its own subagent
4. **Modification with traceability** — every change to target skill files must be logged in the test case document
5. **Escalate, don't guess** — 5× failure on same issue triggers user escalation; no infinite loops

## Boundary Cases

| Situation | Handling |
|-----------|----------|
| Target skill not found | Error, list available skills for selection |
| SKILL.md empty or corrupted | Error, ask user whether to proceed |
| Test objective not applicable to skill | Alert in Stage 2, ask user to adjust |
| Subagent execution timeout | Mark as fail, enter self-healing loop |
| Fix introduces new issue | Treat as new issue (does not count toward 5-retry limit) |
| User interrupts | Save current progress to document, generate partial report |
| No test cases generated | Error in Stage 3, return to Stage 2 for more info |

## Design Decisions

- **Universal framework:** no assumptions about target skill type; auto-explore handles adaptation
- **Subagent isolation:** avoids context pollution between test cases
- **Smart self-healing:** balances autonomy (simple fixes) with safety (user confirmation for complex changes)
- **YAGNI:** no separate experience base — test case documents serve as accumulated knowledge
- **File persistence:** test case docs in `docs/skill-e2e-testing/` provide full traceability
