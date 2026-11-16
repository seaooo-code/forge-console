import { useCallback, useMemo, useState } from "react";

import { StorageAPIError, testStorageConfiguration } from "../api/storage-snapshot";
import type { StorageFormState } from "../types";
import {
  buildStorageMutationInput,
  buildStorageTestSignature,
  normalizeStorageForm,
  validateStorageInput,
} from "../utils";

type StorageTestStatus = "idle" | "testing" | "passed" | "failed";

type UseStorageConnectionTestOptions = {
  getValues: () => StorageFormState;
  isEditMode: boolean;
  setFormError: (message: string) => void;
  storageId: string | undefined;
  watchedForm: Partial<StorageFormState>;
};

/**
 * Owns the "test before save" state machine for the storage form: tracks
 * whether the currently displayed field values match the last successfully
 * tested signature, and exposes the test action itself.
 */
export function useStorageConnectionTest({
  getValues,
  isEditMode,
  setFormError,
  storageId,
  watchedForm,
}: UseStorageConnectionTestOptions) {
  const [testStatus, setTestStatus] = useState<StorageTestStatus>("idle");
  const [testedSignature, setTestedSignature] = useState("");
  const currentSignature = useMemo(
    () => buildStorageTestSignature(buildStorageMutationInput(normalizeStorageForm(watchedForm))),
    [watchedForm],
  );
  const isTesting = testStatus === "testing";
  const isCurrentTestPassed = testStatus === "passed" && testedSignature === currentSignature;
  const isTestStale = testStatus === "passed" && testedSignature !== currentSignature;

  const resetTestState = useCallback(() => {
    setTestStatus("idle");
    setTestedSignature("");
  }, []);

  const handleTestConfiguration = async () => {
    const input = buildStorageMutationInput(getValues());
    const validationError = validateStorageInput(input, isEditMode);
    if (validationError) {
      setFormError(validationError);
      resetTestState();
      return;
    }

    setFormError("");
    setTestStatus("testing");

    try {
      await testStorageConfiguration(input, storageId);
      setTestStatus("passed");
      setTestedSignature(buildStorageTestSignature(input));
    } catch (error) {
      setTestStatus("failed");
      setTestedSignature("");
      const detail = error instanceof StorageAPIError ? error.payload?.detail : undefined;
      setFormError(detail ? `测试存储配置失败：${detail}` : "测试存储配置失败，请检查连接参数");
    }
  };

  return {
    handleTestConfiguration,
    isCurrentTestPassed,
    isTesting,
    isTestStale,
    resetTestState,
    testedSignature,
  };
}
