(function initExperienceSkillGraphDataLoader() {
  'use strict';

  var VALID_TYPES = new Set(['category', 'skill', 'experience']);

  function toSlug(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseWikiLinks(text) {
    var out = [];
    var regex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
    var match;
    while ((match = regex.exec(String(text || '')))) {
      var target = toSlug(match[1]);
      if (target) out.push(target);
    }
    return out;
  }

  function splitSections(markdown) {
    var sections = Object.create(null);
    var lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    var current = null;

    lines.forEach(function(line) {
      var headerMatch = line.match(/^##\s+(.+?)\s*$/);
      if (headerMatch) {
        current = headerMatch[1].trim().toLowerCase();
        if (!sections[current]) sections[current] = [];
        return;
      }
      if (current) sections[current].push(line);
    });

    return sections;
  }

  function parseNodeLines(lines, type) {
    if (!VALID_TYPES.has(type)) throw new Error('Invalid node type: ' + type);

    var nodes = [];
    lines.forEach(function(rawLine) {
      var line = rawLine.trim();
      if (!line || line.indexOf('- ') !== 0) return;

      var payload = line.slice(2).trim();
      var parts = payload.split('|').map(function(part) { return part.trim(); });
      if (parts.length < 3) {
        throw new Error('Invalid ' + type + ' row: ' + rawLine);
      }

      var id = toSlug(parts[0]);
      var label = parts[1];
      var order = Number(parts[2]);
      if (!id) throw new Error('Missing id in row: ' + rawLine);
      if (!label) throw new Error('Missing label in row: ' + rawLine);
      if (!Number.isFinite(order)) {
        throw new Error('Invalid order in row: ' + rawLine);
      }

      var linksText = parts.slice(3).join(' | ');
      nodes.push({
        id: id,
        type: type,
        label: label,
        order: order,
        targetIds: parseWikiLinks(linksText)
      });
    });

    return nodes;
  }

  function stableSortByOrderThenLabel(nodes) {
    return nodes.slice().sort(function(a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.label).localeCompare(String(b.label));
    });
  }

  function buildGraphDataFromMarkdown(markdown) {
    var sections = splitSections(markdown);
    var categories = parseNodeLines(sections['categories'] || [], 'category');
    var skills = parseNodeLines(sections['skills'] || [], 'skill');
    var experiences = parseNodeLines(sections['experiences'] || [], 'experience');

    if (!categories.length || !skills.length || !experiences.length) {
      throw new Error('Missing required sections or rows (Categories, Skills, Experiences)');
    }

    categories = stableSortByOrderThenLabel(categories);
    skills = stableSortByOrderThenLabel(skills);
    experiences = stableSortByOrderThenLabel(experiences);

    var byId = Object.create(null);
    categories.concat(skills, experiences).forEach(function(node) {
      if (byId[node.id]) throw new Error('Duplicate node id: ' + node.id);
      byId[node.id] = node;
    });

    var dedupe = new Set();
    var links = [];

    function addLink(sourceId, targetId) {
      var a = sourceId;
      var b = targetId;
      var key = a < b ? a + '|' + b : b + '|' + a;
      if (dedupe.has(key)) return;
      dedupe.add(key);
      links.push({ source: sourceId, target: targetId });
    }

    skills.forEach(function(skill) {
      skill.targetIds.forEach(function(targetId) {
        var target = byId[targetId];
        if (!target) return;
        if (target.type !== 'category') {
          throw new Error('Skill ' + skill.id + ' can only link to category, got: ' + target.type);
        }
        addLink(skill.id, target.id);
      });
    });

    experiences.forEach(function(exp) {
      exp.targetIds.forEach(function(targetId) {
        var target = byId[targetId];
        if (!target) return;
        if (target.type !== 'skill') {
          throw new Error('Experience ' + exp.id + ' can only link to skill, got: ' + target.type);
        }
        addLink(exp.id, target.id);
      });
    });

    var skillCategory = Object.create(null);
    links.forEach(function(link) {
      var source = byId[link.source];
      var target = byId[link.target];
      if (source.type === 'skill' && target.type === 'category') {
        skillCategory[source.id] = target.id.replace(/^cat-/, '');
      }
      if (source.type === 'category' && target.type === 'skill') {
        skillCategory[target.id] = source.id.replace(/^cat-/, '');
      }
    });

    skills.forEach(function(skill) {
      if (!skillCategory[skill.id]) skillCategory[skill.id] = 'technical';
    });

    var experienceOrder = Object.create(null);
    experiences.forEach(function(exp, idx) {
      experienceOrder[exp.id] = Number.isFinite(exp.order) ? exp.order : idx;
    });

    return {
      categories: categories.map(function(n) { return { id: n.id, type: n.type, label: n.label, order: n.order }; }),
      skills: skills.map(function(n) { return { id: n.id, type: n.type, label: n.label, order: n.order }; }),
      experiences: experiences.map(function(n) { return { id: n.id, type: n.type, label: n.label, order: n.order }; }),
      links: links,
      skillCategory: skillCategory,
      experienceOrder: experienceOrder
    };
  }

  async function fetchText(url) {
    var res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error('Failed to load ' + url + ' (' + res.status + ')');
    }
    return res.text();
  }

  async function loadExperienceSkillGraphData(markdownPath) {
    var dataUrl = new URL(markdownPath, window.location.href);
    var markdown = await fetchText(dataUrl.toString());
    return buildGraphDataFromMarkdown(markdown);
  }

  window.loadExperienceSkillGraphData = loadExperienceSkillGraphData;
})();
