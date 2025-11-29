#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;
}

interface PromptTriggers {
  keywords?: string[];
  intentPatterns?: string[];
}

interface SkillRule {
  type: 'guardrail' | 'domain';
  enforcement: 'block' | 'suggest' | 'warn';
  priority: 'critical' | 'high' | 'medium' | 'low';
  promptTriggers?: PromptTriggers;
}

interface SkillRules {
  version: string;
  skills: Record<string, SkillRule>;
}

interface MatchedSkill {
  name: string;
  matchType: 'keyword' | 'intent';
  config: SkillRule;
}

function parseHookInput(): { prompt: string; rules: SkillRules } {
  const input = readFileSync(0, 'utf-8');
  const data: HookInput = JSON.parse(input);
  const prompt = data.prompt.toLowerCase();

  // Use CWD from hook input, or CLAUDE_PROJECT_DIR env var, or current process CWD
  const projectDir = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');
  const rules: SkillRules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

  return { prompt, rules };
}

function checkSkillMatch(prompt: string, skillName: string, config: SkillRule): MatchedSkill | null {
  const triggers = config.promptTriggers;
  if (!triggers) {
    return null;
  }

  // Keyword matching
  if (triggers.keywords) {
    const keywordMatch = triggers.keywords.some(kw => prompt.includes(kw.toLowerCase()));
    if (keywordMatch) {
      return { name: skillName, matchType: 'keyword', config };
    }
  }

  // Intent pattern matching
  if (triggers.intentPatterns) {
    const intentMatch = triggers.intentPatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(prompt);
    });
    if (intentMatch) {
      return { name: skillName, matchType: 'intent', config };
    }
  }

  return null;
}

function findMatchingSkills(prompt: string, rules: SkillRules): MatchedSkill[] {
  const matchedSkills: MatchedSkill[] = [];

  for (const [skillName, config] of Object.entries(rules.skills)) {
    const match = checkSkillMatch(prompt, skillName, config);
    if (match) {
      matchedSkills.push(match);
    }
  }

  return matchedSkills;
}

function formatSkillGroup(skills: MatchedSkill[], title: string): string {
  if (skills.length === 0) {
    return '';
  }

  let output = `${title}:\n`;
  skills.forEach(s => (output += `  → ${s.name}\n`));
  output += '\n';
  return output;
}

function generateSkillOutput(matchedSkills: MatchedSkill[]): string {
  let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += '🎯 SKILL ACTIVATION CHECK\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Group by priority
  const critical = matchedSkills.filter(s => s.config.priority === 'critical');
  const high = matchedSkills.filter(s => s.config.priority === 'high');
  const medium = matchedSkills.filter(s => s.config.priority === 'medium');
  const low = matchedSkills.filter(s => s.config.priority === 'low');

  output += formatSkillGroup(critical, '⚠️ CRITICAL SKILLS (REQUIRED)');
  output += formatSkillGroup(high, '📚 RECOMMENDED SKILLS');
  output += formatSkillGroup(medium, '💡 SUGGESTED SKILLS');
  output += formatSkillGroup(low, '📌 OPTIONAL SKILLS');

  output += 'ACTION: Use Skill tool BEFORE responding\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  return output;
}

async function main() {
  try {
    const { prompt, rules } = parseHookInput();
    const matchedSkills = findMatchingSkills(prompt, rules);

    if (matchedSkills.length > 0) {
      const output = generateSkillOutput(matchedSkills);
      // eslint-disable-next-line no-console
      console.log(output);
    }

    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in skill-activation-prompt hook:', err);
    process.exit(1);
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Uncaught error:', err);
  process.exit(1);
});
