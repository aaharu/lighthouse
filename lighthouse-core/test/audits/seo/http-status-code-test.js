/**
 * @license Copyright 2017 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const HTTPStatusCodeAudit = require('../../../audits/seo/http-status-code.js');
const assert = require('assert').strict;
const networkRecordsToDevtoolsLog = require('../../network-records-to-devtools-log.js');

/* eslint-env jest */

describe('SEO: HTTP code audit', () => {
  it('fails when status code is unsuccesfull', () => {
    const statusCodes = [403, 404, 500];

    const allRuns = statusCodes.map(statusCode => {
      const finalUrl = 'https://example.com';
      const mainResource = {
        url: finalUrl,
        statusCode,
      };
      const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);

      const artifacts = {
        GatherContext: {gatherMode: 'timespan'},
        devtoolsLogs: {[HTTPStatusCodeAudit.DEFAULT_PASS]: devtoolsLog},
        URL: {finalUrl},
      };

      return HTTPStatusCodeAudit.audit(artifacts, {computedCache: new Map()}).then(auditResult => {
        assert.equal(auditResult.score, 0);
        assert.ok(auditResult.displayValue.includes(statusCode), false);
      });
    });

    return Promise.all(allRuns);
  });

  it('passes when status code is successful', () => {
    const finalUrl = 'https://example.com';
    const mainResource = {
      url: finalUrl,
      statusCode: 200,
    };
    const devtoolsLog = networkRecordsToDevtoolsLog([mainResource]);

    const artifacts = {
      GatherContext: {gatherMode: 'navigation'},
      devtoolsLogs: {[HTTPStatusCodeAudit.DEFAULT_PASS]: devtoolsLog},
      URL: {finalUrl},
    };

    return HTTPStatusCodeAudit.audit(artifacts, {computedCache: new Map()}).then(auditResult => {
      assert.equal(auditResult.score, 1);
    });
  });

  it('throws when main resource cannot be found in navigation', async () => {
    const finalUrl = 'https://example.com';

    const artifacts = {
      GatherContext: {gatherMode: 'navigation'},
      devtoolsLogs: {[HTTPStatusCodeAudit.DEFAULT_PASS]: []},
      URL: {finalUrl},
    };

    const resultPromise = HTTPStatusCodeAudit.audit(artifacts, {computedCache: new Map()});
    await expect(resultPromise).rejects.toThrow();
  });

  it('notApplicable when main resource cannot be found in timespan', async () => {
    const finalUrl = 'https://example.com';

    const artifacts = {
      GatherContext: {gatherMode: 'timespan'},
      devtoolsLogs: {[HTTPStatusCodeAudit.DEFAULT_PASS]: []},
      URL: {finalUrl},
    };

    const results = await HTTPStatusCodeAudit.audit(artifacts, {computedCache: new Map()});
    expect(results.notApplicable).toBe(true);
  });
});
