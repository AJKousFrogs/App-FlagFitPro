import { useReducer, useMemo } from "react";

/**
 * Enhanced useReducer hook that provides automatic action creators
 * and standardized loading/error handling patterns
 */
export const useStandardReducer = (
  initialState,
  actionTypes,
  customReducer = null,
) => {
  // Standard reducer that handles loading and error states
  const standardReducer = (state, action) => {
    // Handle standard loading states
    if (action.type.endsWith("_START")) {
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    }

    // Handle standard success states
    if (action.type.endsWith("_SUCCESS")) {
      return {
        ...state,
        isLoading: false,
        error: null,
        ...action.payload,
      };
    }

    // Handle standard failure states
    if (action.type.endsWith("_FAILURE")) {
      return {
        ...state,
        isLoading: false,
        error: action.payload || action.error || "An error occurred",
      };
    }

    // Handle clear error action
    if (action.type === "CLEAR_ERROR") {
      return {
        ...state,
        error: null,
      };
    }

    // If custom reducer is provided, let it handle the action first
    if (customReducer) {
      const customResult = customReducer(state, action);
      // If custom reducer returns something different, use it
      if (customResult !== state) {
        return customResult;
      }
    }

    // Default case - return state unchanged
    return state;
  };

  const [state, dispatch] = useReducer(standardReducer, initialState);

  // Generate action creators based on action types
  const actions = useMemo(() => {
    const actionCreators = {};

    Object.entries(actionTypes).forEach(([key, actionType]) => {
      // Convert ACTION_TYPE to actionType (camelCase function name)
      const functionName = key
        .toLowerCase()
        .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

      actionCreators[functionName] = (payload) => {
        dispatch({ type: actionType, payload });
      };
    });

    // Add clearError action
    actionCreators.clearError = () => {
      dispatch({ type: "CLEAR_ERROR" });
    };

    return actionCreators;
  }, [actionTypes]);

  return [state, dispatch, actions];
};

/**
 * Simple useReducer hook for basic state management
 */
export const useSimpleReducer = (initialState, reducer) => {
  return useReducer(reducer, initialState);
};

/**
 * Async action helper that handles loading and error states automatically
 */
export const createAsyncAction = (actionTypes, asyncFunction) => {
  return (dispatch) => {
    return async (...args) => {
      try {
        dispatch({ type: actionTypes.START });
        const result = await asyncFunction(...args);
        dispatch({ type: actionTypes.SUCCESS, payload: result });
        return result;
      } catch (error) {
        dispatch({ type: actionTypes.FAILURE, payload: error.message });
        throw error;
      }
    };
  };
};

export default useStandardReducer;
