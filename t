class Solution {

public:

    vector<int> validElements(vector<int>& nums) {

        int n = nums.size();  
        if (n <= 1) {
            return nums;
        }
        
        vector<int> rm(n);
        rm[n-1] = nums[n-1];
        for (int i=n-2; i>=0;i--) {
            rm[i] = max(rm[i + 1], nums[i]);
        }
        
        vector<int> ans;
        ans.push_back(nums[0]);
        int lm = nums[0];
        for (int i = 1; i < n-1; ++i) {
         
            if (nums[i] > lm || nums[i] > rm[i + 1]) {

                ans.push_back(nums[i]);

            }
            lm = max(lm, nums[i]);

        }

        ans.push_back(nums[n-1]);
        return ans;

    }

};