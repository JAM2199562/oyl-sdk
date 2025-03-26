需求描述
现状
我已克隆原始项目 https://github.com/Oyl-Wallet/oyl-sdk 的最新代码。

开发者 JinMaa fork 了原始项目，并在 https://github.com/JinMaa/oyl-sdk 的 rbf 分支（https://github.com/JinMaa/oyl-sdk/tree/rbf）上开发。
jinmaa 向原始项目方提交了一个 pr  https://github.com/Oyl-Wallet/oyl-sdk/pull/407
我把 jinmaa 的代码克隆后放在了 jinmaa 文件夹中。

项目方没有接受它的 pr，且继续进行了开发。
所以现在现状是 jinmaa 的代码is 1 commit ahead of, 93 commits behind Oyl-Wallet/oyl-sdk:main.


我的需求

我想使用项目的最新代码，同时还能够具有 rbf 的功能

我的建议
在 jinmaa 文件夹中阅读4519f7b3d50290913091a6a91e0b57fbadc3148e的提交，理解它增加 rbf 的原理，在项目跟路径下重新应用这个变更。