import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

const INVITES = { __rl: true, mode: 'id', value: '7ApbYM5CwCds9CfL', cachedResultName: 'inbox_invites' };
const DEVICES = { __rl: true, mode: 'id', value: 'eAuPnqIQYDLCG7cr', cachedResultName: 'inbox_devices' };

const start = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.3,
  config: {
    name: 'Когда вызвали',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: {
        values: [
          { name: 'invite', type: 'string' },
          { name: 'device', type: 'string' },
          { name: 'markOpen', type: 'boolean' },
          { name: 'userAgent', type: 'string' },
          { name: 'skipLimit', type: 'boolean' }
        ]
      }
    }
  },
  output: [{ invite: 'TestInvite000001', device: '11111111-2222-4333-8444-555555555555', markOpen: true, userAgent: 'Mozilla/5.0' }]
});

const findInvite = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Найти приглашение',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: INVITES,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'code', condition: 'eq', keyValue: expr('{{ $json.invite || "__нет__" }}') }] },
      returnAll: false,
      limit: 1
    }
  },
  output: [{ id: 1, code: 'TestInvite000001', label: 'Тест', expires_at: '2026-11-06T00:00:00.000Z', limit_count: 50, used: 0, active: true, first_open_at: null }]
});

const check = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Проверить приглашение',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const input = $('Когда вызвали').first().json;\n" +
        "const row = $input.first().json || {};\n" +
        "const code = typeof input.invite === 'string' ? input.invite : '';\n" +
        "const device = typeof input.device === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(input.device) ? input.device : 'unknown';\n" +
        "// /draft дописывает уже посчитанный разбор: лимит для него не проверяем.\n" +
        "const skipLimit = input.skipLimit === true || input.skipLimit === 'true';\n" +
        "let res;\n" +
        "if (!/^[A-Za-z0-9]{16}$/.test(code)) res = { ok: false, status: 401, error: code ? 'unknown_invite' : 'no_invite' };\n" +
        "else if (row.code !== code) res = { ok: false, status: 401, error: 'unknown_invite' };\n" +
        "else if (!row.active) res = { ok: false, status: 403, error: 'inactive' };\n" +
        "else if (new Date(row.expires_at).getTime() < Date.now()) res = { ok: false, status: 403, error: 'expired' };\n" +
        "else if (!skipLimit && Number(row.used) >= Number(row.limit_count)) res = { ok: false, status: 403, error: 'limit_reached' };\n" +
        "else res = {\n" +
        "  ok: true,\n" +
        "  invite: { code: row.code, label: row.label, limit: Number(row.limit_count), used: Number(row.used), expiresAt: row.expires_at, firstOpenAt: row.first_open_at || null, limitNotified: !!row.limit_notified },\n" +
        "  deviceId: device,\n" +
        "  markOpen: input.markOpen === true || input.markOpen === 'true',\n" +
        "  userAgent: String(input.userAgent || '').slice(0, 120)\n" +
        "};\n" +
        "return [{ json: res }];\n"
    }
  },
  output: [{ ok: true, invite: { code: 'TestInvite000001', label: 'Тест', limit: 50, used: 0, expiresAt: '2026-11-06T00:00:00.000Z', firstOpenAt: null, limitNotified: false }, deviceId: '11111111-2222-4333-8444-555555555555', markOpen: true, userAgent: 'Mozilla/5.0' }]
});

const isOk = ifElse({
  version: 2.2,
  config: {
    name: 'Доступ есть?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.ok }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const denied = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Отказ',
    parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Проверить приглашение').first().json }];" }
  },
  output: [{ ok: false, status: 401, error: 'unknown_invite' }]
});

const shouldMark = ifElse({
  version: 2.2,
  config: {
    name: 'Отметить открытие?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.markOpen }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const listDevices = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Устройства приглашения',
    alwaysOutputData: true,
    executeOnce: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: DEVICES,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'invite_code', condition: 'eq', keyValue: expr("{{ $('Проверить приглашение').first().json.invite.code }}") }] },
      returnAll: true
    }
  },
  output: [{ id: 1, device_id: '11111111-2222-4333-8444-555555555555', invite_code: 'TestInvite000001', first_open_at: '2026-10-23T10:00:00.000Z' }]
});

const decide = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Решить про уведомление',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const access = $('Проверить приглашение').first().json;\n" +
        "const devices = $input.all().map((i) => i.json).filter((d) => d && d.device_id);\n" +
        "const known = devices.find((d) => d.device_id === access.deviceId);\n" +
        "const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n" +
        "const label = esc(access.invite.label);\n" +
        "const now = new Date().toISOString();\n" +
        "let notifyText = '';\n" +
        "if (!access.invite.firstOpenAt) notifyText = `${label} открыл(а) демо`;\n" +
        "else if (!known) notifyText = `${label}: демо открыли с ещё одного устройства (всего ${devices.length + 1})`;\n" +
        "return [{ json: { notifyText, deviceFirstOpenAt: known ? known.first_open_at : now, inviteFirstOpenAt: access.invite.firstOpenAt || now, now } }];\n"
    }
  },
  output: [{ notifyText: 'Тест открыл(а) демо', deviceFirstOpenAt: '2026-10-23T10:00:00.000Z', inviteFirstOpenAt: '2026-10-23T10:00:00.000Z', now: '2026-10-23T10:00:00.000Z' }]
});

const rememberDevice = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Запомнить устройство',
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: DEVICES,
      matchType: 'allConditions',
      filters: {
        conditions: [
          { keyName: 'device_id', condition: 'eq', keyValue: expr("{{ $('Проверить приглашение').first().json.deviceId }}") },
          { keyName: 'invite_code', condition: 'eq', keyValue: expr("{{ $('Проверить приглашение').first().json.invite.code }}") }
        ]
      },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          device_id: expr("{{ $('Проверить приглашение').first().json.deviceId }}"),
          invite_code: expr("{{ $('Проверить приглашение').first().json.invite.code }}"),
          first_open_at: expr('{{ $json.deviceFirstOpenAt }}'),
          last_open_at: expr('{{ $json.now }}'),
          user_agent: expr("{{ $('Проверить приглашение').first().json.userAgent }}")
        },
        schema: [
          { id: 'device_id', displayName: 'device_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'invite_code', displayName: 'invite_code', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'first_open_at', displayName: 'first_open_at', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'last_open_at', displayName: 'last_open_at', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'user_agent', displayName: 'user_agent', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1 }]
});

const markInvite = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Отметить приглашение',
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: INVITES,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'code', condition: 'eq', keyValue: expr("{{ $('Проверить приглашение').first().json.invite.code }}") }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          first_open_at: expr("{{ $('Решить про уведомление').first().json.inviteFirstOpenAt }}"),
          last_open_at: expr("{{ $('Решить про уведомление').first().json.now }}")
        },
        schema: [
          { id: 'first_open_at', displayName: 'first_open_at', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'last_open_at', displayName: 'last_open_at', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1 }]
});

const hasNotify = ifElse({
  version: 2.2,
  config: {
    name: 'Есть уведомление?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr("{{ $('Решить про уведомление').first().json.notifyText }}"), operator: { type: 'string', operation: 'notEmpty', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const notify = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Уведомить Игоря',
    onError: 'continueRegularOutput',
    executeOnce: true,
    parameters: {
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'V5enTDa4sYzRmNZo', cachedResultName: 'Inbox · Уведомление' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { text: expr("{{ $('Решить про уведомление').first().json.notifyText }}") },
        schema: [{ id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }]
      },
      mode: 'once',
      options: { waitForSubWorkflow: false }
    }
  },
  output: [{ ok: true }]
});

const result = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Результат',
    parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Проверить приглашение').first().json }];" }
  },
  output: [{ ok: true }]
});

export default workflow('inbox-access-check', 'Inbox · Проверка доступа')
  .add(start)
  .to(findInvite)
  .to(check)
  .to(
    isOk
      .onTrue(
        shouldMark
          .onTrue(listDevices.to(decide).to(rememberDevice).to(markInvite).to(hasNotify.onTrue(notify.to(result)).onFalse(result)))
          .onFalse(result)
      )
      .onFalse(denied)
  );
